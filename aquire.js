#!/usr/bin/env node

const trackingDB = require('./trackingDB');
const amazon = require('./amazon');
const trackDriver = require('./trackDriver');

const agent = undefined;
const tries = 3

function log(data) {
  process.stdout.write(JSON.stringify({ timestamp: new Date().toISOString(), ...data }) + '\n');
}

async function authenticate(username, cookies) {
  try {
    const password = await trackingDB.getUserPassword(username);
    cookies = await amazon.newSession(username, password, true, cookies);
  
    for(const cookie of cookies) {
      await trackingDB.setCookie(username, cookie);
    }

    return cookies;
  } catch (error) {
    log({logLevel: 'error', message: `Could not authenticate ${username}: ${error}`});
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
    log({ logLevel: 'error', message: `Failed to refresh session for ${username}: ${error}` });
  }
}

async function logResult(result) {
  await trackingDB.updatePackageStatus(result.trackingObjectId, result.trackingObjectState);

  const timestamp = result.transporterDetails?.geoLocation?.locationTime
    ? new Date(result.transporterDetails.geoLocation.locationTime * 1000.0)
    : new Date();

  log({ logLevel: 'info', message: `Store result for ${result.trackingObjectId} (${result.trackingObjectState})` });

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
    log({ logLevel: 'info', message: 'Inserting old data' });
    const fs = require('fs');
    const data = await fs.promises.readFile('/tmp/all.json', 'utf8');
    const json = JSON.parse(data);
    for (const r of json) {
      await logResult(r);
    }
    log({ logLevel: 'info', message: 'Finished inserting old data' });
  }

  var n = 0;
  while (true) {
    log({ logLevel: 'info', message: `Run ${++n}` });
    const packages = await trackingDB.getAllPackages();
  
    for(const package of packages) {
      log({ logLevel: 'info', message: 'Current package', currentPackage: package });
      for (var retry = 0; retry < tries; retry++) {
        var cookies = await trackingDB.getCookies(package.userName);
  
        const result = await trackDriver(package.trackingNumber, cookies, agent);
        if (!result.error) {
          delete result.destinationAddress;
          log({ logLevel: 'verbose', message: 'Tracking data', trackingData: result });
          await logResult(result);
          break;
        }
  
        log({ logLevel: 'warn', message: `Received HTTP ${result.error} for user ${package.userName}` });
        if (result.error === 400 || result.error === 500) {
          log({ logLevel: 'info', message: `Reauthenticating ${package.userName}...` });
          // Not sending cookies causes amazon not to ask to 'switch users'. Instead, just start over entirely
          cookies = await authenticate(package.userName);
          //cookies = await authenticate(package.userName, cookies);
  
          continue;
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 15000));
  }

  process.exit(0);
})();
