const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create moon and stars icon SVG with solid colors (better compatibility)
const createIconSvg = (size) => {
  const scale = size / 512;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <!-- Dark navy background with rounded corners -->
  <rect width="512" height="512" rx="96" fill="#0A0E1A"/>

  <!-- Subtle inner glow -->
  <rect x="16" y="16" width="480" height="480" rx="80" fill="#151B2B" opacity="0.5"/>

  <!-- Moon crescent - main shape -->
  <circle cx="256" cy="256" r="140" fill="#3B82F6"/>
  <!-- Moon cutout to create crescent -->
  <circle cx="320" cy="200" r="110" fill="#0A0E1A"/>

  <!-- Stars -->
  <circle cx="380" cy="120" r="12" fill="#F8FAFC"/>
  <circle cx="420" cy="180" r="8" fill="#F8FAFC" opacity="0.8"/>
  <circle cx="440" cy="280" r="6" fill="#F8FAFC" opacity="0.6"/>
  <circle cx="400" cy="360" r="10" fill="#F8FAFC" opacity="0.7"/>
  <circle cx="360" cy="420" r="7" fill="#F8FAFC" opacity="0.5"/>

  <!-- Small accent stars -->
  <circle cx="120" cy="140" r="6" fill="#F8FAFC" opacity="0.5"/>
  <circle cx="90" cy="220" r="8" fill="#F8FAFC" opacity="0.6"/>
  <circle cx="100" cy="340" r="5" fill="#F8FAFC" opacity="0.4"/>
  <circle cx="140" cy="400" r="7" fill="#F8FAFC" opacity="0.5"/>
</svg>`;
};

async function generateIcons() {
  const iconsDir = path.join(__dirname, '../public/icons');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('Generating PWA icons with moon and stars design...\n');

  // Generate each size
  for (const size of sizes) {
    const svg = createIconSvg(512); // Always use 512 as source for best quality
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svg))
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 10, g: 14, b: 26, alpha: 1 }
      })
      .png({ quality: 100 })
      .toFile(outputPath);

    console.log(`✓ Created: icon-${size}x${size}.png`);
  }

  // Generate Apple touch icon (180x180)
  const appleSvg = createIconSvg(512);
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 10, g: 14, b: 26, alpha: 1 }
    })
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ Created: apple-touch-icon.png');

  // Generate favicon
  const faviconSvg = createIconSvg(512);
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 10, g: 14, b: 26, alpha: 1 }
    })
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'favicon-32x32.png'));
  console.log('✓ Created: favicon-32x32.png');

  // Also save the SVG
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), createIconSvg(512));
  console.log('✓ Created: icon.svg');

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
