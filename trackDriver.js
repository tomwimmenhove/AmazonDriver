const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

function cookiesToHeader(cookies) {
  return cookies
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
}

async function trackDriver(trackingId, cookies, agent) {
  const url = `https://securephotostorageservice-eu-external.amazon.co.uk/DEANSExternalPackageLocationDetailsProxy/trackingObjectId/${trackingId}/clientName/AMZL`;
  const cookieHeader = cookiesToHeader(cookies);
  const sessionId = cookies
    .find(cookie => cookie.name === 'session-id' && cookie.domain === '.amazon.co.uk')?.value;

  response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie'           : cookieHeader,
      'x-amzn-SessionId' : sessionId,
      'User-Agent'       : userAgent,
      'Accept'           : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    },
    agent
  });

  if (response.status != 200) {
    return {
      'error': response.status,
      'message': `HTTP status code ${response.status}`
    }
  }

  const body = await response.text();
  const tracking = JSON.parse(body);
 
  return tracking;
}

module.exports = trackDriver;

