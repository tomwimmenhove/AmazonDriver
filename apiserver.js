#!/usr/bin/env node

const trackingDB = require('./trackingDB');
const express = require('express');

const app = express();
const port = process.env.PORT || 30000;

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
  // basic sanitization
  if (!/^[\w-]+$/.test(trackingId)) {
    throw new Error('Invalid trackingId');
  }

  // compute Date objects
  const defaultAfter = new Date(Date.now() - 24 * 3600 * 1000);
  const afterDate  = parseDate(afterStr, defaultAfter);
  const untilDate = parseDate(untilStr, undefined, afterDate);

  console.log(
    `DB query for ${trackingId} after ${afterDate.toISOString()}` +
    (untilDate ? ` until ${untilDate.toISOString()}` : '')
  );

  const history = await trackingDB.getGeoHistory(trackingId, afterDate, untilDate);

  return history.map(r => ({
    time:             r.timeStamp,
    lat:              r.lat,
    lng:              r.lon,
  }));
}

const ALPH32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function encodeTracking(tracking) {
  const indices = Array.from(tracking, ch => {
    const idx = ALPH32.indexOf(ch);
    if (idx === -1) {
      throw new Error(`Invalid character "${ch}"—must be in ALPH32.`);
    }
    return idx;
  });
  // pack into a Buffer of one-byte values and base64
  return Buffer.from(indices).toString('base64');
}

function decodeTracking(code) {
  const buf = Buffer.from(code, 'base64');
  return Array.from(buf, byte => {
    if (byte < 0 || byte >= ALPH32.length) {
      throw new Error(`Decoded byte ${byte} out of range`);
    }
    return ALPH32[byte];
  }).join('');
}

// -- Express routes ----------------------------------------------------------
app.get('/api/history', async (req, res) => {
  if (!req.query.trackingId) {
    res.status(400).json({ error: 'Bad Request' });
    return;
  }

  const decodedTrackingId = decodeTracking(req.query.trackingId);
  try {
    const points = await loadRoutePoints(
      decodedTrackingId,
      req.query.after,
      req.query.until
    );
    res.json(points);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/list', async (req, res) => {
  try {
    const packages = await trackingDB.getAllPackages();
    const encodedPackages = packages.map(pack => {
      return {
        trackingId: encodeTracking(pack.trackingNumber),
        createdAt: pack.packageCreatedAt
      };
    });

    res.json(encodedPackages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

