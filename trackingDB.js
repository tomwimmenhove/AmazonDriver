const pool = require('./db');

async function callProcedure(name, params = []) {
  const conn = await pool.getConnection();
  try {
    // mysql2 returns an array of result sets; we grab the first
    const [resultSets] = await conn.query(
      `CALL ${name}(${params.map(() => '?').join(',')})`,
      params
    );
    return resultSets;
  } finally {
    conn.release();
  }
}

module.exports = {
  // ── User Management ─────────────────────────────────────────────────────────

  async addUser(userName, password) {
    await callProcedure('CreateUser', [userName, password]);
  },

  /**
   * Retrieve the hashed password for a given userName.
   * Throws if the user does not exist.
   * @param {string} userName
   * @returns {Promise<string>} the password string
   */
  async getUserPassword(userName) {
    const rows = await callProcedure('GetUserPassword', [userName]);
    const row = rows[0];
    if (row) {
      return row[0].password;
   }
  },

  // ── Package Management ──────────────────────────────────────────────────────

  async addPackage(userName, trackingNumber, destLat = null, destLon = null, destAlt = null, accuracy = null) {
    await callProcedure('AddPackageForUser', [
      userName, trackingNumber, destLat, destLon, destAlt, accuracy
    ]);
  },

  /**
   * Mark a package as picked up.
   * Does nothing if pickedUpAt is already set.
   *
   * @param {string} trackingNumber
   * @param {string|Date|null} pickedUpAt — if null, NOW() will be used
   */
  async setPickupTime(trackingNumber, pickedUpAt = null) {
    // Format JS Date to MySQL DATETIME, or pass null
    const ts = pickedUpAt
      ? (pickedUpAt instanceof Date
          ? pickedUpAt.toISOString().slice(0, 19).replace('T', ' ')
          : pickedUpAt)
      : null;

    await callProcedure('SetPickupTime', [
      trackingNumber,
      ts
    ]);
  },

  /**
   * Mark a package as delivered.
   * Does nothing if deliveredAt is already set.
   *
   * @param {string} trackingNumber
   * @param {string|Date|null} deliveredAt — if null, NOW() will be used
   */
  async setDeliveredTime(trackingNumber, deliveredAt = null) {
    // Format JS Date to MySQL DATETIME, or pass null
    const ts = deliveredAt
      ? (deliveredAt instanceof Date
          ? deliveredAt.toISOString().slice(0, 19).replace('T', ' ')
          : deliveredAt)
      : null;

    await callProcedure('SetDeliveredTime', [
      trackingNumber,
      ts
    ]);
  },

  /**
   * Update only the deliveryStatus of a package.
   * Creates the status string if it doesn't already exist.
   *
   * @param {string} trackingNumber
   * @param {string} status       // e.g. 'In Transit'
   */
  async updatePackageStatus(trackingNumber, status) {
    await callProcedure('UpdatePackageStatus', [
      trackingNumber,
      status
    ]);
  },

  /**
   * Get package status by tracking number.
   * Returns {trackingNumber, deliveryStatus, pickedUpAt, deliveredAt}
   * 
   * @param {string} trackingNumber
   * @returns {Promise<Object>}
   */
  async getPackageStatus(trackingNumber) {
    const [rows] = await callProcedure('GetPackageStatus', [trackingNumber]);
    return rows[0] || null;
  },

  /**
   * Get a list of all packages, with usernames and delivery-status strings.
   * @returns {Promise<Array<Object>>} Array of packages:
   *  [{ userName, trackingNumber, packageCreatedAt, pickedUpAt, deliveredAt,
   *     lastUpdated, destLat, destLon, destAlt, accuracy, deliveryStatus }, …]
   */
  async getAllPackages() {
    // CALL the stored procedure without params
    const rows = await callProcedure('GetAllPackages', []);
    return rows[0];
  },
  
  // ── Geo-Tracking ───────────────────────────────────────────────────────────

  async addGeoPoint(trackingNumber, timeStamp, lat, lon, alt, accuracy, status) {
    const rows = await callProcedure('AddGeoTrackingEntry', [
      trackingNumber, timeStamp, lat, lon, alt, accuracy, status
    ]);
    return rows[0];
  },

  async getGeoHistory(trackingNumber, startTime = null, endTime = null) {
    const rows = await callProcedure('GetGeoEntriesByTrackingNumber', [
      trackingNumber, startTime, endTime
    ]);
    return rows[0];
  },

  async getCurrentLocation(trackingNumber) {
    const rows = await callProcedure('GetCurrentLocationByTrackingNumber', [
      trackingNumber
    ]);
    return rows[0];
  },

  /**
   * Gets the estimated 7-day driving schedule (Mon–Sun) for a given trackingId, either from
   * cache (if younger than maxAgeSeconds) or by recalculating and repopulating the cache.
   *
   * @param {number} trackingNumber  the trackingId you want to summarize
   * @param {number} maxAgeSeconds   how fresh the cache must be (in seconds)
   * @returns {Promise<Array<{
   *   day: string,
   *   numSamples: number,
   *   earliestStart: string,   // TIME format
   *   latestStart: string,     // TIME format
   *   earliestEnd: string,     // TIME format
   *   latestEnd: string,       // TIME format
   *   generatedAt: string,     // DATETIME when this summary was generated
   *   ageSeconds: number       // how many seconds old the cached row is
   * }>>}
   */
  async getSchedule(trackingNumber, maxAgeSeconds) {
    // call the stored procedure we defined earlier
    const rows = await callProcedure('GetSchedule', [
      trackingNumber,
      maxAgeSeconds
    ]);
    return rows[0];
  },

  // ── Visits ───────────────────────────────────────────────────────

  async storeVisit(conn, trackingNumber, numVisits, trackingEnabled, lat, lon) {
    const [rows] = await conn.query(
      'CALL StoreVisit(?,?,?,?,?)',
      [trackingNumber, numVisits, trackingEnabled, lat, lon]
    );
    return rows[0];
  },
		
  async getVisits(trackingNumber) {
    const rows = await callProcedure('GetVisits', [
      trackingNumber
    ]);
    return rows[0];
  },

  // ── Cookie Management ───────────────────────────────────────────────────────
  /**
   * Upsert a Puppeteer‐style cookie object for a user.
   * @param {string} userName
   * @param {object} cookie  { domain, path, secure, httpOnly, sameSite, expires, session, name, value }
   */
  async setCookie(userName, cookie) {
    await callProcedure('UpsertUserCookie', [
      userName,
      cookie.domain,
      cookie.path,
      cookie.secure ? 1 : 0,
      cookie.httpOnly ? 1 : 0,
      cookie.sameSite,      // 'Strict' | 'Lax' | 'None'
      cookie.expires !== undefined ? cookie.expires : null,
      cookie.session ? 1 : 0,
      cookie.name,
      cookie.value
    ]);
  },

  /**
   * Get one cookie by key and convert numeric flags to booleans.
   */
  async getCookie(userName, domain, path, name) {
    const rows = await callProcedure('GetUserCookie', [
      userName, domain, path, name
    ]);
    const row = rows[0] || null;
    if (!row) return null;
    const cookie = {
      domain:     row.domain,
      path:       row.path,
      secure:     Boolean(row.secure),
      httpOnly:   Boolean(row.httpOnly),
      sameSite:   row.sameSite,
      expires:    row.expires,
      session:    Boolean(row.session),
      name:       row.name,
      value:      row.value
    };

    if (row.sameSite) {
      cookie.sameSite = row.sameSite;
    }

    return cookie;
  },

  /**
   * Get all cookies for a given user, converting flags to booleans.
   */
  async getCookies(userName) {
    const rows = await callProcedure('GetUserCookies', [
      userName
    ]);

    return rows[0].map(row => {
      const cookie = {
        domain:   row.domain,
        path:     row.path,
        secure:   Boolean(row.secure),
        httpOnly: Boolean(row.httpOnly),
        expires:  row.expires,
        session:  Boolean(row.session),
        name:     row.name,
        value:    row.value
      };

      if (row.sameSite) {
        cookie.sameSite = row.sameSite;
      }

      return cookie;
    });
  },

  // ── Transactions ────────────────────────────────────────────────────────

  async beginTransaction() {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    return conn;
  },

  async clearVisits(conn) {
    conn ??= await pool.getConnection();
    await conn.query('DELETE FROM Visits');
  },

  async commitTransaction(conn) {
    await conn.commit();
    conn.release();
  },

  async rollbackTransaction(conn) {
    await conn.rollback();
    conn.release();
  },

  // ── Generic Helpers ────────────────────────────────────────────────────────

  async executeTransaction(fn) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
};

