const { chromium } = require('playwright');
const path = require('path');

const screenshots = [
  { file: 'screenshot-1-hero.html', output: 'Screenshot-1-Hero.png' },
  { file: 'screenshot-2-tracking.html', output: 'Screenshot-2-Tracking.png' },
  { file: 'screenshot-3-analytics.html', output: 'Screenshot-3-Analytics.png' },
  { file: 'screenshot-4-correlation.html', output: 'Screenshot-4-Correlation.png' },
  { file: 'screenshot-5-athletes.html', output: 'Screenshot-5-Athletes.png' },
];

async function captureScreenshots() {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: {
      width: 1284,
      height: 2778,
    },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  for (const screenshot of screenshots) {
    const filePath = `file://${path.join(__dirname, screenshot.file)}`;
    const outputPath = path.join(__dirname, screenshot.output);

    console.log(`Capturing ${screenshot.file}...`);

    await page.goto(filePath, { waitUntil: 'networkidle' });

    // Wait for fonts to load
    await page.waitForFunction(() => document.fonts.ready);

    // Small delay for rendering
    await page.waitForTimeout(500);

    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1284,
        height: 2778,
      },
    });

    console.log(`✓ Saved ${screenshot.output}`);
  }

  await browser.close();
  console.log('\n✅ All screenshots captured!');
  console.log(`📁 Files saved in: ${__dirname}`);
}

captureScreenshots().catch(console.error);
