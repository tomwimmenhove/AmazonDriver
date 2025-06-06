#!/usr/bin/env node

require('dotenv').config();
const trackingDB = require('./trackingDB');
const amazon = require('./amazon');
const trackDriver = require('./trackDriver');
const logger = require('./logger');

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
    logger.error(`Could not authenticate ${username}`, error);
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
    logger.error(`Failed to refresh session for ${username}`, error);
  }
}

async function logResult(result) {
  await trackingDB.updatePackageStatus(result.trackingObjectId, result.trackingObjectState);

  const timestamp = result.transporterDetails?.geoLocation?.locationTime
    ? new Date(result.transporterDetails.geoLocation.locationTime * 1000.0)
    : new Date();

  logger.debug('Tracking state', { trackingNumber: result.trackingObjectId, trackingState: result.trackingObjectState });

  if (result.trackingObjectState === 'PICKED_UP') {
    await trackingDB.setPickupTime(result.trackingObjectId, timestamp);
  } else if (result.trackingObjectState === 'DELIVERED') {
    await trackingDB.setDeliveredTime(result.trackingObjectId, timestamp);
  }

  const geoLocation = result.transporterDetails?.geoLocation;
  if (geoLocation && geoLocation.latitude && geoLocation.longitude && geoLocation.locationTime) {
    logger.info('Geopoint', {
      trackingNumber: result.trackingObjectId,
      latitude      : geoLocation.latitude,
      longitude     : geoLocation.longitude,
      altitude      : geoLocation.altitude,
      accuracy      : geoLocation.accuracy,
/*      destination   : {
	      latitude: result?.destinationAddress?.geoLocation?.latitude,
	      longitude: result?.destinationAddress?.geoLocation?.longitude
      }*/
    });
    await trackingDB.addGeoPoint(
      result.trackingObjectId,
      timestamp,
      geoLocation.latitude, geoLocation.longitude, geoLocation.altitude, geoLocation.accuracy,
      result.trackingObjectState
    );
  }
}

(async () => {
  logger.info('Data acquisition started');

  var n = 0;
  while (true) {
    logger.debug(`Iteration`, { n: ++n });

    var packages;
    while (true) {
      try {
        packages = await trackingDB.getAllPackages();
        break;
      } catch (error) {
        logger.error('An exception occurred while retrieving packages', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    for(const package of packages) {
      if (package.deliveryStatus === 'DELIVERED') {
        continue;
      }
      logger.debug('Polling', { trackingNumber: package.trackingNumber });
      for (var retry = 0; retry < tries; retry++) {
        try {
          var cookies = await trackingDB.getCookies(package.userName);
    
          const result = await trackDriver(package.trackingNumber, cookies, agent);
          if (!result.error) {
            await logResult(result);
            break;
          }
    
          logger.warn('Received unexpected HTTP status code', { statusCode: result.error, userName: package.userName });
          if (result.error === 400 || result.error === 500) {
            logger.info('Reauthenticate user', { userName: package.userName, retry });
            // Not sending cookies causes amazon not to ask to 'switch users'. Instead, just start over entirely
            cookies = await authenticate(package.userName);
            //cookies = await authenticate(package.userName, cookies);
    
            continue;
          }
        } catch (error) {
          logger.error('An exception occurred while processing package', error);
          continue;
        }

        logger.error('Exhausted reauthenticating retries', { userName: package.userName });
      }
    }

    await new Promise(resolve => setTimeout(resolve, 15000));
  }

  process.exit(0);
})();
