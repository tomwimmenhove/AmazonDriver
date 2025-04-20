const fs = require('fs');
const fetch = require('node-fetch');
const tough = require('tough-cookie');
const FileCookieStore = require('@root/file-cookie-store');

/**
 * Ensures the cookie file exists; creates an empty file if it does not.
 * @param {string} filePath - Path to the cookie file
 */
function ensureCookieFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
  }
}

/**
 * Creates a CookieJar backed by a file-based store (Netscape format).
 * @param {string} filePath - Path to the cookie file
 * @returns {tough.CookieJar}
 */
function createCookieJar(filePath = './cookies.txt') {
  ensureCookieFile(filePath);
  return new tough.CookieJar(new FileCookieStore(filePath));
}

/**
 * A fetch-like function that manages cookies in a file.
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options plus `cookieFile`
 * @param {string} [options.cookieFile='./cookies.txt'] - Path to the cookie store file
 * @param {object} [options.headers] - Additional headers to send
 * @param {object} [options.agent] - HTTP/S or proxy agent
 * @param {string} [options.method] - HTTP method (GET, POST, etc.)
 * @param {any} [options.body] - Request body
 * @returns {Promise<import('node-fetch').Response>} - The fetch response
 */
async function cookieFetch(url, options = {}) {
  var {
    cookieFile = './cookies.txt',
    method = 'GET',
    headers = {},
    agent,
  } = options;

  // Initialize the cookie jar
  const jar = createCookieJar(cookieFile);

  // Retrieve existing cookies for the URL
  const cookieHeader = await new Promise((resolve, reject) => {
    jar.getCookieString(url, (err, cookies) => {
      if (err) reject(err);
      else resolve(cookies);
    });
  });

  headers['Cookie'] = cookieHeader;

  //console.log({url, headers});

  // Perform the fetch
  const response = await fetch(url, {
    method,
    headers,
    agent,
  });

  // Store any Set-Cookie headers back into the jar
  const setCookies = response.headers.raw()['set-cookie'] || [];
  await Promise.all(
    setCookies.map(cookieStr =>
      new Promise((resolve, reject) => {
        jar.setCookie(cookieStr, url, { ignoreError: true }, err => {
          if (err) reject(err);
          else resolve();
        });
      })
    )
  );

  response.cookies = await jar.getCookies(url);

  return response;
}

module.exports = cookieFetch

