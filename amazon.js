const puppeteer = require('puppeteer');
const path = require('path');

const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

async function newSession(email, password, headless = true, cookies) {
  const browser = await puppeteer.launch({
    headless: headless,
//    userDataDir: path.resolve(__dirname, 'userdata')
  });
  const page    = await browser.newPage();

  await page.setUserAgent(userAgent);

  if (cookies) {
    page.setCookie(...cookies);
  }

  //await page.goto('https://www.amazon.co.uk/gp/flex/sign-out.html', { waitUntil: 'networkidle2' });
  await page.goto('https://www.amazon.co.uk/', { waitUntil: 'networkidle2' });
  await Promise.all([
    page.click('#nav-link-accountList'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  await page.waitForSelector('input#ap_email, input[name="email"]');
  await page.type('#ap_email', email);
  await Promise.all([
    page.click('input#continue'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  await page.waitForSelector('input#ap_password, input[name="password"]');
  await page.type('#ap_password', password);
  await Promise.all([
    page.click('input#signInSubmit'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  await page.goto('https://www.amazon.co.uk/', { waitUntil: 'networkidle2' });

  const allCookies = await page.cookies();
  await browser.close();

  return allCookies;
}

async function refreshSession(headless = true, cookies) {
  const browser = await puppeteer.launch({
    headless: headless,
//    userDataDir: path.resolve(__dirname, 'userdata')
  });
  const page    = await browser.newPage();

  await page.setUserAgent(userAgent);

  if (cookies) {
    page.setCookie(...cookies);
  }

  await page.goto('https://www.amazon.co.uk/', { waitUntil: 'networkidle2' });
  await Promise.all([
    page.click('#nav-link-accountList'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  const allCookies = await page.cookies();
  await browser.close();

  return allCookies;
}

module.exports = { newSession, refreshSession };

