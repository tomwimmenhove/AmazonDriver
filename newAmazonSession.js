const puppeteer = require('puppeteer');
const path = require('path');

//const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
//         + 'AppleWebKit/537.36 (KHTML, like Gecko) '
//         + 'Chrome/132.0.0.0 Safari/537.36';
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

async function newAmazonSession(email, password, headless = true, cookies) {
  // 1. Launch a headless browser
  const browser = await puppeteer.launch({
    headless: headless,
//    userDataDir: path.resolve(__dirname, 'userdata')
  });
  const page    = await browser.newPage();

  // 2. Spoof a real Chrome/Windows userAgent
  await page.setUserAgent(userAgent);

  if (cookies) {
    page.setCookie(...cookies);
  }

  // 3. Open Amazon UK homepage and click "Account & Lists"
//  await page.goto('https://www.amazon.co.uk/gp/flex/sign-out.html', { waitUntil: 'networkidle2' });
  await page.goto('https://www.amazon.co.uk/', { waitUntil: 'networkidle2' });
  await Promise.all([
    page.click('#nav-link-accountList'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  // 4. Enter email and click Continue
  await page.waitForSelector('input#ap_email, input[name="email"]');
  await page.type('#ap_email', email);
  await Promise.all([
    page.click('input#continue'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  // 5. Wait for password field, type password, submit
  await page.waitForSelector('input#ap_password, input[name="password"]');
  await page.type('#ap_password', password);
  await Promise.all([
    page.click('input#signInSubmit'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  // 6. Reload homepage to trigger any JS-set cookies
  await page.goto('https://www.amazon.co.uk/', { waitUntil: 'networkidle2' });

  // 7. Extract all cookies
  const allCookies = await page.cookies();
  await browser.close();

  // 8. Map cookies to a simple object
  return allCookies;//.reduce((map, c) => ((map[c.name] = c.value), map), {});
}

module.exports = newAmazonSession

