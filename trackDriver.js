const cookieFetch = require('./cookieFetch');
const cookie = require('cookie');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                  '(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

async function getSessionId(agent) {
  const response = await cookieFetch('https://www.amazon.co.uk/', {
    cookieFile: './cookies.txt',
    method: 'GET',
    headers: {
      'User-Agent': userAgent,
    },
    agent
  });

  if (response.status != 200) {
    console.error(`Unexpected HTTP status code ${response.status} while retrieving session-id`);
    return;
  }

  const sessionIdCookie = response.cookies.find(c => c.key === 'session-id');

  if (sessionIdCookie) {
    return sessionIdCookie.value;
  }
}

async function trackDriver(trackingId, agent) {
  const sessionId = await getSessionId(agent);

  if (!sessionId) {
    console.error('No session-id received');
    return;
  }

  const url = `https://securephotostorageservice-eu-external.amazon.co.uk/DEANSExternalPackageLocationDetailsProxy/trackingObjectId/${trackingId}/clientName/AMZL`;

  response = await cookieFetch(url, {
    method: 'GET',
    headers: {
      'x-amzn-SessionId' : sessionId,
      'User-Agent'       : userAgent,
      'Accept'           : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    },
    agent
  });

  if (response.status != 200) {
    console.error(`Unexpected HTTP status code ${response.status} while retrieving tracking information`);
    return;
  }

  const body = await response.text();
  const tracking = JSON.parse(body);
 
  return tracking;
}

module.exports = trackDriver;

