#!/usr/bin/env node

const trackingDB = require('./trackingDB');
const amazon = require('./amazon');
const trackDriver = require('./trackDriver');

const agent = undefined;
const tries = 3

async function authenticate(username, cookies) {
  try {
    const password = await trackingDB.getUserPassword(username);
    cookies = await amazon.newSession(username, password, true, cookies);
  
    for(const cookie of cookies) {
      await trackingDB.setCookie(username, cookie);
    }

    return cookies;
  } catch (error) {
    console.error(`Could not authenticate ${username}:`, error);
  }
}

async function refresh(username, cookies) {
  try {
    cookies = await amazon.refreshSession(true, cookies);
  
    for(const cookie of cookies) {
      await trackingDB.setCookie(username, cookie);
    }

    return cookies;
  } catch (error) {
    console.error(`Failed to refresh session for ${username}`, error);
  }
}

async function logResult(result) {
  await trackingDB.updatePackageStatus(result.trackingObjectId, result.trackingObjectState);

  const timestamp = result.transporterDetails?.geoLocation?.locationTime
    ? new Date(result.transporterDetails.geoLocation.locationTime * 1000.0)
    : new Date();

  console.log(JSON.stringify({
    timestamp: {
      epoch: result.transporterDetails?.geoLocation?.locationTime,
      useCurrentTime: !result.transporterDetails?.geoLocation?.locationTime, 
      usedTimestamp: timestamp
   }
  }, null, 2));

  if (result.trackingObjectState === 'PICKED_UP') {
    await trackingDB.setPickupTime(result.trackingObjectId, timestamp);
  } else if (result.trackingObjectState === 'DELIVERED') {
    await trackingDB.setDeliveredTime(result.trackingObjectId, timestamp);
  }

  const geoLocation = result.transporterDetails?.geoLocation;
  if (geoLocation && geoLocation.latitude && geoLocation.longitude && geoLocation.locationTime) {
    await trackingDB.addGeoPoint(
      result.trackingObjectId,
      timestamp,
      geoLocation.latitude, geoLocation.longitude, geoLocation.altitude, geoLocation.accuracy,
      result.trackingObjectState
    );
  }
}

(async () => {
  if (false) {
    // Insert old data
    console.error('Inserting old data');
    const fs = require('fs');
    const data = await fs.promises.readFile('/tmp/all.json', 'utf8');
    const json = JSON.parse(data);
    for (const r of json) {
      await logResult(r);
    }
    console.error('DONE');
  }

  var n = 0;
  while (true) {
    console.log(JSON.stringify({
      run: {
        timestamp: new Date(),
        iteration: ++n,
      }
    }, null, 2));
    const packages = await trackingDB.getAllPackages();
  
    for(const package of packages) {
      console.log(JSON.stringify({ currentPackage: package }, null, 2));
      for (var retry = 0; retry < tries; retry++) {
        var cookies = await trackingDB.getCookies(package.userName);
  
        const result = await trackDriver(package.trackingNumber, cookies, agent);
        if (!result.error) {
          delete result.destinationAddress;
          await logResult(result);
          console.log(JSON.stringify({ trackingData: result }, null, 2));
          break;
        }
  
        console.error(`Received HTTP ${result.error} for user ${package.userName}`);
        if (result.error === 400 || result.error === 500) {
          console.error(`Reauthenticating ${package.userName}...`);
          cookies = await authenticate(package.userName);//, cookies);
//          console.error(`Refreshing session for ${package.userName}...`);
//          cookies = await refresh(package.userName, cookies);
  
          continue;
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 15000));
  }

  process.exit(0);
})();
