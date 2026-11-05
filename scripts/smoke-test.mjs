import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

const baseUrl = process.env.APP_URL ?? 'http://127.0.0.1:4173';
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

const executablePath = chromeCandidates.find((candidate) => existsSync(candidate));
if (!executablePath) {
  throw new Error('Chrome/Edge was not found. Set CHROME_PATH to run the smoke test.');
}

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--font-render-hinting=none'],
  defaultViewport: { width: 1440, height: 1100 },
});

const page = await browser.newPage();
const consoleErrors = [];
const pageErrors = [];

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('dialog', async (dialog) => {
  await dialog.accept();
});

const toArabicDigits = (value) =>
  String(value).replace(/[0-9]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);

async function waitForText(text, timeout = 15000) {
  await page.waitForFunction(
    (needle) => document.body?.innerText.includes(needle),
    { timeout },
    text,
  );
}

async function clickButton(text, { exact = false, selector = 'button' } = {}) {
  const clicked = await page.evaluate(
    (needle, isExact, buttonSelector) => {
      const normalize = (value) => value.replace(/\s+/g, ' ').trim();
      const isVisible = (node) => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      };
      const element = [...document.querySelectorAll(buttonSelector)].find((node) => {
        if (!isVisible(node)) return false;
        const label = normalize(node.textContent ?? '');
        return isExact ? label === needle : label.includes(needle);
      });
      if (!element) return false;
      element.click();
      return true;
    },
    text,
    exact,
    selector,
  );

  if (!clicked) throw new Error(`Could not find button containing: ${text}`);
  await new Promise((resolve) => setTimeout(resolve, 120));
}

async function clickAriaLabel(label) {
  const clicked = await page.evaluate((value) => {
    const element = [...document.querySelectorAll(`button[aria-label="${value}"]`)].find(
      (node) => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      },
    );
    if (!element) return false;
    element.click();
    return true;
  }, label);

  if (!clicked) throw new Error(`Could not find element with aria-label: ${label}`);
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function assertText(text, message) {
  await waitForText(text);
  const found = await page.evaluate(
    (needle) => document.body.innerText.includes(needle),
    text,
  );
  if (!found) throw new Error(message ?? `Expected page to contain: ${text}`);
  console.log(`  ✓ ${message ?? text}`);
}

async function readScopeStat(label) {
  return page.evaluate((needle) => {
    const labelElement = [...document.querySelectorAll('span')].find(
      (node) => node.textContent?.trim() === needle,
    );
    const card = labelElement?.closest('div');
    return card?.querySelector('.tabular-nums')?.textContent?.trim() ?? null;
  }, label);
}

async function assertNoHorizontalOverflow(label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) {
    throw new Error(`${label} overflows horizontally by ${overflow}px`);
  }
  console.log(`  ✓ No horizontal overflow: ${label}`);
}

try {
  await page.goto(baseUrl, { waitUntil: 'load', timeout: 30000 });
  await waitForText('اختبار حفظ القرآن الكريم');
  console.log('Initial page loaded');

  const direction = await page.evaluate(() => document.documentElement.dir);
  if (direction !== 'rtl') throw new Error('The document is not RTL');
  console.log('  ✓ Document direction is RTL');

  await assertText('طريقة الاستخدام في ٥ خطوات', 'Usage guide rendered');
  await assertText('حساب الدرجة', 'Points scoring explained');
  await assertText('نطاق الاختبار', 'Scope selector rendered');
  await assertText('إعدادات الاختبار', 'Test settings rendered');
  await assertText('٦٬٢٣٦', 'Full local Quran dataset is loaded');

  // Scope tabs and pickers.
  await clickButton('الصفحات', { exact: true });
  await page.click('#enable-page-range');
  await assertText('من الصفحة ١ إلى الصفحة ٦٠٤', 'Page range picker works');
  await page.click('#enable-page-range');

  await clickButton('الأجزاء', { exact: true });
  await page.evaluate(() => {
    const button = document.querySelector('#scope-panel-juz button[aria-pressed="false"]');
    if (button) button.click();
  });
  await assertText('تم اختيار ١ من أصل ٣٠ جزءًا', 'Juz picker works');

  await clickButton('نطاقات مخصصة', { exact: true });
  await clickButton('إضافة نطاق', { exact: true });
  const rangeSelects = await page.evaluate(
    () => document.querySelectorAll('#scope-panel-ranges select').length,
  );
  if (rangeSelects < 2) throw new Error('Custom range row was not added');
  console.log('  ✓ Custom ranges picker works');

  await clickButton('إعادة تعيين', { exact: true });

  // Presets are additive: «المفصل» + «النصف الأول» without replacing each other.
  await clickButton('المفصل', { exact: true });
  const mufassalAyahs = await readScopeStat('الآيات');
  await clickButton('الصفحات', { exact: true });
  await page.click('#enable-page-range');
  await clickButton('النصف الأول', { exact: true });
  const combinedAyahs = await readScopeStat('الآيات');
  if (!mufassalAyahs || !combinedAyahs || combinedAyahs === mufassalAyahs) {
    throw new Error('Adding a page range did not extend the preset scope');
  }
  const presetStillActive = await page.evaluate(() =>
    [...document.querySelectorAll('button')].some(
      (node) =>
        node.textContent?.replace(/\s+/g, ' ').trim() === 'المفصل' &&
        node.className.includes('bg-teal-700'),
    ),
  );
  if (!presetStillActive) throw new Error('Preset lost its active state after combining');
  await clickButton('المفصل', { exact: true });
  const afterSecondClick = await readScopeStat('الآيات');
  if (afterSecondClick !== combinedAyahs) {
    throw new Error('Clicking an active preset duplicated its scope');
  }
  console.log('  ✓ Presets combine with other scopes without duplicates');
  await clickButton('إعادة تعيين', { exact: true });

  // Start a test using a preset.
  await clickButton('المفصل', { exact: true });
  await assertText('ملخص النطاق المحدد', 'Preset applied');
  await clickButton('٥', { exact: true });
  await clickButton('ابدأ الاختبار', { exact: true });
  await waitForText('السؤال ١ من ٥');
  console.log('Test started with 5 balanced questions');

  await assertText('تقييم التسميع بالدرجات', 'Evaluation panel rendered');
  await assertText('درجة السؤال', 'Deduction points total rendered');
  await assertText('تردد', 'Hesitation counter rendered');
  const firstVerse = await page.$eval('.quran-text', (node) => node.textContent ?? '');
  if (firstVerse.trim().length < 5) throw new Error('Verse text was not rendered');
  console.log('  ✓ Quran verse rendered');

  await clickButton('إخفاء النص', { exact: true });
  await assertText('النص مخفي', 'Blind mode hides the verse');
  await clickButton('إظهار نص الآية', { exact: true });
  await page.waitForSelector('.quran-text');
  console.log('  ✓ Verse can be revealed again');

  await clickButton('التالية', { exact: true });
  const secondVerse = await page.$eval('.quran-text', (node) => node.textContent ?? '');
  if (secondVerse === firstVerse) throw new Error('Next ayah did not change');
  console.log('  ✓ Next ayah navigation works');

  await clickButton('السابقة', { exact: true });
  await clickButton('بداية السؤال', { exact: true });

  const evaluations = [
    { hifz: 0, tajweed: 0, hesitations: 0 },
    { hifz: 1, tajweed: 0, hesitations: 0 },
    { hifz: 0, tajweed: 1, hesitations: 0 },
    { hifz: 0, tajweed: 0, hesitations: 2 },
    { hifz: 1, tajweed: 0, hesitations: 1 },
  ];

  for (let index = 0; index < evaluations.length; index += 1) {
    const evaluation = evaluations[index];
    for (let count = 0; count < evaluation.hesitations; count += 1) {
      await clickAriaLabel('زيادة تردد');
    }
    for (let count = 0; count < evaluation.hifz; count += 1) {
      await clickAriaLabel('زيادة خطأ حفظ');
    }
    for (let count = 0; count < evaluation.tajweed; count += 1) {
      await clickAriaLabel('زيادة خطأ تجويد');
    }

    if (index === 4) {
      await assertText('١٫٥', 'Half-point deductions are added correctly');
    }

    const isLast = index === evaluations.length - 1;
    await clickButton(isLast ? 'حفظ وعرض النتائج' : 'حفظ والتالي', { exact: true });

    if (!isLast) {
      await waitForText(`السؤال ${toArabicDigits(index + 2)} من ٥`);
      console.log(`  ✓ Advanced to question ${index + 2}`);
    }
  }

  await waitForText('نتيجة التقييم');
  console.log('Results screen reached');

  await assertText('إجمالي الدرجات', 'Deduction points total shown');
  await assertText('٤٫٥', 'Expected total points computed');
  await assertText('٠٫٩ درجة', 'Expected average points computed');
  await assertText('أسئلة بدون أخطاء', 'Clean questions stat shown');
  await assertText('تفصيل الدرجات', 'Points breakdown shown');
  await assertText('سور تحتاج مراجعة', 'Revision plan shown');
  await assertText('تفاصيل الأسئلة', 'Question breakdown shown');
  await assertText('حفظ ×١', 'Hifz mistake badge shown');
  await assertText('تجويد ×١', 'Tajweed mistake badge shown');
  await assertText('تردد ×٢', 'Hesitation badge shown');
  await assertText('بدون أخطاء', 'Clean question badge shown');

  const resultCount = await page.evaluate(
    () => document.querySelectorAll('section article').length,
  );
  if (resultCount < 5) throw new Error('Question breakdown is incomplete');
  console.log('  ✓ Results breakdown contains all questions');

  await clickButton('إعادة بنفس النطاق', { exact: true });
  await waitForText('السؤال ١ من ٥');
  console.log('  ✓ Restart with same scope works');

  await clickButton('إنهاء مبكر', { exact: true });
  await waitForText('نتيجة التقييم');

  await clickButton('العودة إلى الإعدادات', { exact: true });
  await waitForText('نطاق الاختبار');
  console.log('  ✓ Returning to setup works');

  // Resume with previous config and verify surah picker still works.
  await clickButton('السور', { exact: true });
  await clickButton('تحديد الكل', { exact: true });
  await assertText('تم اختيار ١١٤ سورة', 'Surah multi-select works');
  await clickButton('إعادة تعيين', { exact: true });

  // Responsive check: no horizontal page overflow on a small mobile viewport.
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.reload({ waitUntil: 'load' });
  await waitForText('نطاق الاختبار');
  await assertNoHorizontalOverflow('mobile setup');

  await clickButton('المفصل', { exact: true });
  await clickButton('٥', { exact: true });
  await clickButton('ابدأ الاختبار', { exact: true });
  await waitForText('السؤال ١ من ٥');
  await assertNoHorizontalOverflow('mobile testing');

  const saveInViewport = await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((node) => {
      const box = node.getBoundingClientRect();
      return (
        box.width > 0 &&
        box.height > 0 &&
        (node.textContent ?? '').replace(/\s+/g, ' ').trim().includes('حفظ والتالي')
      );
    });
    if (!button) return false;
    const box = button.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= window.innerHeight;
  });
  if (!saveInViewport) {
    throw new Error('The next-question button is not visible without scrolling on mobile');
  }
  console.log('  ✓ Next-question button is always in view on mobile');

  await clickAriaLabel('زيادة تردد');
  const dockScore = await page.evaluate(
    () =>
      document.querySelector('[aria-label^="درجة السؤال"]')?.getAttribute('aria-label') ??
      '',
  );
  if (!dockScore.includes('٠٫٥')) {
    throw new Error('The mobile evaluation dock did not record a half-point hesitation');
  }
  console.log('  ✓ Mobile dock records half-point hesitations');

  await clickAriaLabel('ملاحظات المختبر');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('textarea')].some(
      (node) => node.getBoundingClientRect().height > 0,
    ),
  );
  await page.evaluate(() => {
    const textarea = [...document.querySelectorAll('textarea')].find(
      (node) => node.getBoundingClientRect().height > 0,
    );
    if (!textarea) return;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )?.set;
    setter?.call(textarea, 'ملاحظة اختبار الهاتف');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await clickButton('تم', { exact: true });
  await clickButton('حفظ والتالي', { exact: true });
  await waitForText('السؤال ٢ من ٥');
  console.log('  ✓ Mobile save button advances to the next question');

  await clickButton('إنهاء مبكر', { exact: true });
  await waitForText('نتيجة التقييم');
  await assertText('ملاحظات المختبر', 'Dedicated examiner notes section shown');
  await assertText('١ ملاحظة', 'Examiner notes count shown');
  await assertText('ملاحظة اختبار الهاتف', 'Mobile note saved with the evaluation');
  await assertNoHorizontalOverflow('mobile results');

  if (pageErrors.length > 0) {
    throw new Error(`Page errors:\n${pageErrors.join('\n')}`);
  }
  if (consoleErrors.length > 0) {
    throw new Error(`Console errors:\n${consoleErrors.join('\n')}`);
  }

  console.log('\nSmoke test passed with no console or page errors.');
} finally {
  await browser.close();
}
