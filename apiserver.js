#!/usr/bin/env node

require('dotenv').config();
const trackingDB = require('./trackingDB');
const express = require('express');
const requestIp = require('request-ip');
const logger = require('./logger');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 30000;
const secret = process.env.SECRET;

// -- Date parsing utils ------------------------------------------------------

/**
 * Parse a user‐supplied date or delta string.
 * - If `input` is falsy, returns `defaultDate`.
 * - If `input` starts with "d<number>", it's treated as seconds delta from `relativeTo`.
 * - Otherwise, parsed with `new Date(input)`.
 */
function parseDate(input, defaultDate, relativeTo = new Date()) {
  if (!input) {
    return defaultDate;
  }
  if (input.charAt(0) === 'd' && input.length > 1) {
    const secs = Number(input.slice(1));
    if (Number.isNaN(secs)) return defaultDate;
    return new Date(relativeTo.getTime() + secs * 1000);
  }
  const dt = new Date(input);
  return Number.isNaN(dt.getTime()) ? defaultDate : dt;
}

// -- Geo-tracking via Stored Procedure ---------------------------------------

/**
 * Load route points from the database by calling
 * GetGeoEntriesByTrackingNumber(trackingNumber, after, until).
 *
 * @param {string} trackingId 
 * @param {string} afterStr — either ISO string or "d<seconds>"
 * @param {string} untilStr — optional end filter
 * @returns {Promise<Array<Object>>} array of { time, lat, lng, alt, accuracy }
 */
async function loadRoutePoints(trackingId, afterStr, untilStr) {
  if (!/^[\w-]+$/.test(trackingId)) {
    throw new Error('Invalid trackingId');
  }

  const defaultAfter = new Date(Date.now() - 24 * 3600 * 1000);
  const afterDate  = parseDate(afterStr, defaultAfter);
  const untilDate = parseDate(untilStr, undefined, afterDate);
  const history = await trackingDB.getGeoHistory(trackingId, afterDate, untilDate);

  return history.map(r => ({
    time:             r.timeStamp,
    lat:              r.lat,
    lng:              r.lon,
  }));
}

function encrypt(message, secret) {
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);

  return Buffer.concat([iv, encrypted]).toString('base64');
}

function decrypt(data, secret) {
  try {
  const b = Buffer.from(data, 'base64');
  const iv = b.slice(0, 16);
  const ciphertext = b.slice(16);
  const key = crypto.createHash('sha256').update(secret).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

app.use(requestIp.mw());

app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info('HTTP request', {
      ip: req.clientIp,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode
    });
  });
  next();
});

app.get('/api/history', async (req, res) => {
  if (!req.query.trackingId) {
    logger.error('No trackingId in query');
    res.status(400).json({ error: 'Bad Request' });
    return;
  }

  const decodedTrackingId = decrypt(req.query.trackingId, secret);
  try {
    const points = await loadRoutePoints(
      decodedTrackingId,
      req.query.after,
      req.query.until
    );
    res.json(points);
  } catch (error) {
    logger.error('Error while loading route points', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/list', async (req, res) => {
  try {
    const packages = await trackingDB.getAllPackages();
    const encodedPackages = packages.map(pack => {
      return {
        trackingId: encrypt(pack.trackingNumber, secret),
        deliveryStatus: pack.deliveryStatus,
        createdAt: pack.packageCreatedAt
      };
    });

    res.json(encodedPackages);
  } catch (error) {
    logger.errpr('Error while listing packages', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/schedule', async (req, res) => {
  if (!req.query.trackingId) {
    logger.error('No trackingId in query');
    return res.status(400).json({ error: 'Bad Request: trackingId required' });
  }

  //const maxAgeSeconds = parseInt(req.query.maxAgeSeconds, 10) || 3600;
  const maxAgeSeconds = 3600;
  const decodedTrackingId = decrypt(req.query.trackingId, secret);

  try {
    const summary = await trackingDB.getSchedule(
      decodedTrackingId,
      maxAgeSeconds
    );
    res.json(summary);
  } catch (error) {
    logger.error('Error while loading tracking summary', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/visits', async (req, res) => {
  if (!req.query.trackingId) {
    logger.error('No trackingId in query');
    return res.status(400).json({ error: 'Bad Request: trackingId required' });
  }

  const decodedTrackingId = decrypt(req.query.trackingId, secret);

  try {
    var visits = await trackingDB.getVisits(decodedTrackingId);
    visits = visits.map(({ lon, ...rest }) => ({
      ...rest,
      lng: lon
    }));

    res.json(visits);
  } catch (error) {
    logger.error(`Error fetching visits for ${trackingNumber}`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

const server = app.listen(port, () => {
  logger.info('Server starting', { port });
});

server.on('error', (err) => {
  logger.error('Server failed to start', { error: err.message, code: err.code });
  process.exit(1);
});

