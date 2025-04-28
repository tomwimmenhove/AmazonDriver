const mysql = require('mysql2/promise');

// Create a single pool for the entire app
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'local',
  dateStrings: false,
  queueLimit: 0
});

module.exports = pool;

