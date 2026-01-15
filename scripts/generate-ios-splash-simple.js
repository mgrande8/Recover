const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Generate a splash screen SVG with centered logo
const generateSplashSvg = (size) => {
  const logoSize = size * 0.3;
  const centerX = size / 2;
  const centerY = size / 2;
  const scale = logoSize / 512;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <!-- Background -->
    <rect width="${size}" height="${size}" fill="#0A0E1A"/>

    <!-- Centered Logo -->
    <g transform="translate(${centerX - logoSize/2}, ${centerY - logoSize/2 - 40}) scale(${scale})">
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
    </g>

    <!-- App Name -->
    <text x="${centerX}" y="${centerY + logoSize/2 + 20}"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, sans-serif"
          font-size="${size * 0.04}"
          font-weight="700"
          fill="#F8FAFC">RECOVER</text>
    <text x="${centerX}" y="${centerY + logoSize/2 + 50}"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, sans-serif"
          font-size="${size * 0.015}"
          fill="#94A3B8">Sleep Better, Perform Better</text>
  </svg>`;
};

async function generateSplashScreens() {
  const splashDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/Splash.imageset');
  const size = 2732;

  console.log('Generating iOS Splash Screens...\\n');

  const svg = generateSplashSvg(size);

  // Generate the three required splash images
  await sharp(Buffer.from(svg))
    .png({ quality: 100 })
    .toFile(path.join(splashDir, 'splash-2732x2732.png'));
  console.log('✓ Created: splash-2732x2732.png');

  await sharp(Buffer.from(svg))
    .png({ quality: 100 })
    .toFile(path.join(splashDir, 'splash-2732x2732-1.png'));
  console.log('✓ Created: splash-2732x2732-1.png');

  await sharp(Buffer.from(svg))
    .png({ quality: 100 })
    .toFile(path.join(splashDir, 'splash-2732x2732-2.png'));
  console.log('✓ Created: splash-2732x2732-2.png');

  console.log('\\n✅ iOS Splash Screens generated successfully!');
}

generateSplashScreens().catch(console.error);
