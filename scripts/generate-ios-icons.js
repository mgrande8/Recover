const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// iOS App Icon sizes (for AppIcon.appiconset)
const iosSizes = [
  { size: 20, scale: 1, idiom: 'ipad' },
  { size: 20, scale: 2, idiom: 'iphone' },
  { size: 20, scale: 2, idiom: 'ipad' },
  { size: 20, scale: 3, idiom: 'iphone' },
  { size: 29, scale: 1, idiom: 'ipad' },
  { size: 29, scale: 2, idiom: 'iphone' },
  { size: 29, scale: 2, idiom: 'ipad' },
  { size: 29, scale: 3, idiom: 'iphone' },
  { size: 38, scale: 2, idiom: 'iphone' },
  { size: 38, scale: 3, idiom: 'iphone' },
  { size: 40, scale: 2, idiom: 'iphone' },
  { size: 40, scale: 2, idiom: 'ipad' },
  { size: 40, scale: 3, idiom: 'iphone' },
  { size: 60, scale: 2, idiom: 'iphone' },
  { size: 60, scale: 3, idiom: 'iphone' },
  { size: 64, scale: 2, idiom: 'ipad' },
  { size: 64, scale: 3, idiom: 'ipad' },
  { size: 68, scale: 2, idiom: 'ipad' },
  { size: 76, scale: 1, idiom: 'ipad' },
  { size: 76, scale: 2, idiom: 'ipad' },
  { size: 83.5, scale: 2, idiom: 'ipad' },
  { size: 1024, scale: 1, idiom: 'ios-marketing' },
];

// SVG source for the icon
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0A0E1A"/>
  <rect x="16" y="16" width="480" height="480" fill="#151B2B" opacity="0.5"/>
  <circle cx="256" cy="256" r="140" fill="#3B82F6"/>
  <circle cx="320" cy="200" r="110" fill="#0A0E1A"/>
  <circle cx="380" cy="120" r="12" fill="#F8FAFC"/>
  <circle cx="420" cy="180" r="8" fill="#F8FAFC" opacity="0.8"/>
  <circle cx="440" cy="280" r="6" fill="#F8FAFC" opacity="0.6"/>
  <circle cx="400" cy="360" r="10" fill="#F8FAFC" opacity="0.7"/>
  <circle cx="360" cy="420" r="7" fill="#F8FAFC" opacity="0.5"/>
  <circle cx="120" cy="140" r="6" fill="#F8FAFC" opacity="0.5"/>
  <circle cx="90" cy="220" r="8" fill="#F8FAFC" opacity="0.6"/>
  <circle cx="100" cy="340" r="5" fill="#F8FAFC" opacity="0.4"/>
  <circle cx="140" cy="400" r="7" fill="#F8FAFC" opacity="0.5"/>
</svg>`;

async function generateIosIcons() {
  const appIconDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');

  // Ensure directory exists
  if (!fs.existsSync(appIconDir)) {
    fs.mkdirSync(appIconDir, { recursive: true });
  }

  console.log('Generating iOS App Icons...\\n');

  const contents = {
    images: [],
    info: {
      author: 'xcode',
      version: 1,
    },
  };

  // Generate each icon size
  for (const icon of iosSizes) {
    const pixelSize = Math.round(icon.size * icon.scale);
    const filename = `AppIcon-${icon.size}x${icon.size}@${icon.scale}x-${icon.idiom}.png`;

    await sharp(Buffer.from(iconSvg))
      .resize(pixelSize, pixelSize, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 10, g: 14, b: 26, alpha: 1 },
      })
      .png({ quality: 100 })
      .toFile(path.join(appIconDir, filename));

    console.log(`✓ Created: ${filename} (${pixelSize}x${pixelSize})`);

    contents.images.push({
      filename: filename,
      idiom: icon.idiom,
      scale: `${icon.scale}x`,
      size: `${icon.size}x${icon.size}`,
    });
  }

  // Write Contents.json
  fs.writeFileSync(
    path.join(appIconDir, 'Contents.json'),
    JSON.stringify(contents, null, 2)
  );
  console.log('\\n✓ Created: Contents.json');

  console.log('\\n✅ iOS App Icons generated successfully!');
}

generateIosIcons().catch(console.error);
