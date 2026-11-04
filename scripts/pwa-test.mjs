import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const baseUrl = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4174';
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

const executablePath = chromeCandidates.find((candidate) => existsSync(candidate));
if (!executablePath) {
  throw new Error('Chrome/Edge was not found. Set CHROME_PATH to run the PWA test.');
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1280, height: 900 },
});

const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForFunction(
    async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return Boolean(registration?.active);
    },
    { timeout: 30000 },
  );
  console.log('  ✓ Service worker registered and active');

  const manifest = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]');
    if (!link) return null;
    const response = await fetch(link.href);
    return response.json();
  });

  if (!manifest) throw new Error('Web app manifest link was not found');
  if (manifest.dir !== 'rtl' || manifest.lang !== 'ar') {
    throw new Error('Manifest language/direction is incorrect');
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) {
    throw new Error('Manifest icons are missing');
  }
  console.log('  ✓ Web app manifest is valid (RTL, Arabic, icons present)');

  const iconStatuses = await page.evaluate(async (iconUrls) => {
    const statuses = [];
    for (const url of iconUrls) {
      const response = await fetch(url);
      statuses.push(response.ok);
    }
    return statuses;
  }, manifest.icons.map((icon) => new URL(icon.src, baseUrl).href));

  if (iconStatuses.some((ok) => !ok)) {
    throw new Error('One or more manifest icons could not be fetched');
  }
  console.log('  ✓ PWA icons are available');

  const cacheInfo = await page.evaluate(async () => {
    const keys = await caches.keys();
    const entries = await Promise.all(
      keys.map(async (key) => {
        const cache = await caches.open(key);
        return (await cache.keys()).length;
      }),
    );
    return { keys, entries };
  });
  if (cacheInfo.keys.length === 0) throw new Error('No workbox caches were created');
  console.log(
    `  ✓ Precache created (${cacheInfo.keys.length} cache(s), ${cacheInfo.entries.join(' + ')} entries)`,
  );

  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(
    (needle) => document.body?.innerText.includes(needle),
    { timeout: 20000 },
    'اختبار حفظ القرآن الكريم',
  );
  const offlineState = await page.evaluate(() => ({
    online: navigator.onLine,
    text: document.body.innerText,
  }));
  if (offlineState.online) throw new Error('Browser did not enter offline mode');
  if (!offlineState.text.includes('٦٬٢٣٦')) {
    throw new Error('Quran data did not load while offline');
  }
  console.log('  ✓ App and full Quran data load successfully while offline');

  if (errors.length > 0) throw new Error(`Page errors:\n${errors.join('\n')}`);

  console.log('\nPWA/offline test passed.');
} finally {
  await browser.close();
}
