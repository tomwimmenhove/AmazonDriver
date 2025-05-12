#!/usr/bin/env node

// For example: ./analyze.js 15 50 100 480 3600 100

const trackingDB = require('./trackingDB');

const fs = require('fs');

if (process.argv.length < 8) {
  console.error(`Usage: node ${process.argv[1]} <minPoints> <radiusMeters> <timeWindowSeconds> <minTimeDiff> <maxTimeDiff> <mergeDistanceMeters>`);
  process.exit(1);
}

const [,, minPointsArg, radiusArg, timeWindowArg, minTimeDiffArg, maxTimeDiffArg, mergeDistArg] = process.argv;
const minPoints = parseInt(minPointsArg, 10);
const radius = parseFloat(radiusArg);
const timeWindow = parseFloat(timeWindowArg) * 1000;
const minTimeDiff = parseFloat(minTimeDiffArg) * 1000;
const maxTimeDiff = parseFloat(maxTimeDiffArg) * 1000;
const mergeDist = parseFloat(mergeDistArg);

class UnionFind {
  constructor(n) { this.parent = Array.from({ length: n }, (_, i) => i); }
  find(x) { return this.parent[x] === x ? x : (this.parent[x] = this.find(this.parent[x])); }
  union(a, b) { const pa = this.find(a), pb = this.find(b); if (pa !== pb) this.parent[pb] = pa; }
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function centroid(points) {
  const sum = points.reduce((acc, p) => { acc.lat += p.lat; acc.lon += p.lon; return acc; }, { lat: 0, lon: 0 });
  return { lat: sum.lat / points.length, lon: sum.lon / points.length };
}

function getTrackedClusters(history) {
  const clusters = [];
  let currentRun = [history[0]];
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    const dt = curr.timeStamp - prev.timeStamp;
    const d  = haversine(prev.lat, prev.lon, curr.lat, curr.lon);
  
    if (dt <= timeWindow && d <= radius) {
      currentRun.push(curr);
    } else {
      if (currentRun.length >= minPoints) clusters.push(currentRun);
      currentRun = [curr];
    }
  }
  if (currentRun.length >= minPoints) clusters.push(currentRun);

  return clusters;
}

function getUntrackedClusters(history) {
  const clusters = [];
  
  for (let i = 1; i < history.length; i++) {
    const prev = history[i-1];
    const curr = history[i];
    const dt = curr.timeStamp - prev.timeStamp;
    const d  = haversine(prev.lat, prev.lon, curr.lat, curr.lon);
  
    if (dt >= minTimeDiff && dt <= maxTimeDiff && d <= radius) {
      const lat = (prev.lat + curr.lat) / 2;
      const lon = (prev.lon + curr.lon) / 2;
  
      clusters.push([{lat: prev.lat, lon: prev.lon}, {lat: lat, lon: lon}]);
    }
  }

  return clusters;
}

function getMergedClusters(clusters) {
  // Compute centroids for each cluster
  const centroids = clusters.map(run => centroid(run));
  
  // Step 2: merge clusters whose centroids are within mergeDist
  const uf = new UnionFind(centroids.length);
  for (let i = 0; i < centroids.length; i++) {
    for (let j = i + 1; j < centroids.length; j++) {
      const d = haversine(
	centroids[i].lat, centroids[i].lon,
	centroids[j].lat, centroids[j].lon
      );
      if (d <= mergeDist) uf.union(i, j);
    }
  }
  
  // Group merged clusters
  const groups = {};
  centroids.forEach((c, idx) => {
    const root = uf.find(idx);
    if (!groups[root]) groups[root] = [];
    groups[root].push(idx);
  });
  
  Object.keys(groups).forEach(key => { if (groups[key].length <= 1) delete groups[key]; });
  return groups;
}

(async () => {
  const packages = await trackingDB.getAllPackages();

  for (const package of packages) {
    const history = await trackingDB.getGeoHistory(package.trackingNumber, null, null);

    const conn = await trackingDB.beginTransaction();
    try {
      await trackingDB.clearVisits(conn);
  
      const trackedClusters = getTrackedClusters(history);
      if (trackedClusters.length === 0) {
        console.log('No consecutive tracked clusters found matching criteria.');
      }
  
      const untrackedClusters = getUntrackedClusters(history);
      if (untrackedClusters.length === 0) {
        console.log('No consecutive untracked clusters found matching criteria.');
      }
  
      var tracked = true;
      for(const clusters of [ trackedClusters, untrackedClusters] ) {
        if (clusters.length == 0) {
          continue;
        }
  
        const mergedClusters = getMergedClusters(clusters);
    
        console.log(`Found ${clusters.length} initial cluster(s), merged into ${Object.keys(mergedClusters).length} group(s):`);
        for (const [root, idxs] of Object.entries(mergedClusters)) {
          const allPoints = idxs.flatMap(i => clusters[i]);
          const { lat, lon } = centroid(allPoints);
          console.log(`\nClusters: ${idxs.map(i => i+1).join(', ')}; total points=${allPoints.length}:`);
          console.log(`\tCombined Centroid: lat=${lat.toFixed(6)}, lon=${lon.toFixed(6)}`);
          console.log(`\tGoogle Maps: https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`);
          await trackingDB.storeVisit(conn, package.trackingNumber, idxs.length, tracked, lat, lon);
        }
        tracked = false;
      }
      await trackingDB.commitTransaction(conn);
    } catch (err) {
      await trackingDB.rollbackTransaction(conn);
      console.log(err);
    }

  }

  process.exit(0);
})();

