const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG template for the Recover app icon
const generateSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#151B2B"/>
      <stop offset="100%" style="stop-color:#0A0E1A"/>
    </linearGradient>
    <linearGradient id="moon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#60A5FA"/>
      <stop offset="100%" style="stop-color:#3B82F6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <path d="M256 96c-88.4 0-160 71.6-160 160s71.6 160 160 160c30.4 0 58.8-8.4 83.2-23.2-17.6 9.6-37.6 15.2-59.2 15.2-70.4 0-128-57.6-128-128s57.6-128 128-128c21.6 0 41.6 5.6 59.2 15.2C314.8 104.4 286.4 96 256 96z" fill="url(#moon)"/>
  <circle cx="380" cy="140" r="8" fill="#F8FAFC" opacity="0.8"/>
  <circle cx="420" cy="200" r="6" fill="#F8FAFC" opacity="0.6"/>
  <circle cx="140" cy="180" r="5" fill="#F8FAFC" opacity="0.5"/>
  <circle cx="100" cy="280" r="7" fill="#F8FAFC" opacity="0.7"/>
  <circle cx="400" cy="340" r="5" fill="#F8FAFC" opacity="0.5"/>
</svg>`;

// Try to use sharp if available, otherwise create SVG files
async function generateIcons() {
  const iconsDir = path.join(__dirname, '../public/icons');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  try {
    // Try to use sharp for PNG generation
    const sharp = require('sharp');

    console.log('Generating PNG icons with sharp...');

    for (const size of sizes) {
      const svg = generateSvg(size);
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`Created: icon-${size}x${size}.png`);
    }

    // Generate Apple touch icon
    const appleSvg = generateSvg(180);
    await sharp(Buffer.from(appleSvg))
      .resize(180, 180)
      .png()
      .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
    console.log('Created: apple-touch-icon.png');

    console.log('\\nAll icons generated successfully!');

  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('sharp not installed. Creating SVG placeholders...');
      console.log('To generate PNG icons, run: npm install sharp && node scripts/generate-icons.js');

      // Create SVG files as fallback
      for (const size of sizes) {
        const svg = generateSvg(size);
        const outputPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
        fs.writeFileSync(outputPath, svg);
        console.log(`Created SVG: icon-${size}x${size}.svg`);
      }
    } else {
      throw err;
    }
  }
}

generateIcons().catch(console.error);
