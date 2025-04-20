#!/usr/bin/env node

const trackDriver = require('./trackDriver.js');

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

  console.log(JSON.stringify(tracking, null, 2));
})();

