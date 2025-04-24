#!/usr/bin/env node

const path = require('path');
const trackDriver = require('./trackDriver.js');
const fs = require('fs').promises;
const { SocksProxyAgent } = require('socks-proxy-agent');

(async () => {
  const trackingId = process.argv[2];
  const proxy = process.argv[3];

  if (!trackingId) {
    console.log('Error: Please provide a valid tracking number as the first argument.');
    process.exit(1);
  }

  var agent;
  if (proxy) {
    console.log(`Using proxy: ${proxy}`);
    agent = new SocksProxyAgent(proxy);
  }

  const tracking = await trackDriver(trackingId, agent);
  if (!tracking) {
    console.error(`Failed to track driver for tracking ID ${trackingId}`);
    return;
  }

  const trackingDirPath = path.join(path.resolve(__dirname, 'tracking'), trackingId);
  await fs.mkdir(trackingDirPath, { recursive: true });

  console.log(`Tracking status: ${tracking.trackingObjectState}`);

  var outputPath;
  if (tracking.trackingObjectState === 'NOT_READY') {
    outputPath = path.join(trackingDirPath, 'last_NOT_READY.json');
  } else if (tracking.trackingObjectState === 'DELIVERED') {
    outputPath = path.join(trackingDirPath, 'first_DELIVERED.json');
    if (await fileExists(outputPath)) {
        console.log('All files already written');
        process.exit(0);
    }
  } else {
    if (!tracking.transporterDetails?.geoLocation) {
      console.log('No location data provided. No data saved.');
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:]/g, '');
    outputPath = path.join(trackingDirPath, `${timestamp}.json`);
  }

  var relativePath = path.relative(__dirname, outputPath);
  console.log(`Output path: ${relativePath}`);

  await fs.writeFile(outputPath, JSON.stringify(tracking, null, 2));
})();

