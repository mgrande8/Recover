const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// iOS Splash Screen sizes
const splashSizes = [
  { width: 1334, height: 750, filename: 'splash-1334x750.png' },    // iPhone SE landscape
  { width: 750, height: 1334, filename: 'splash-750x1334.png' },    // iPhone SE portrait
  { width: 1792, height: 828, filename: 'splash-1792x828.png' },    // iPhone 11 landscape
  { width: 828, height: 1792, filename: 'splash-828x1792.png' },    // iPhone 11 portrait
  { width: 2436, height: 1125, filename: 'splash-2436x1125.png' },  // iPhone X landscape
  { width: 1125, height: 2436, filename: 'splash-1125x2436.png' },  // iPhone X portrait
  { width: 2688, height: 1242, filename: 'splash-2688x1242.png' },  // iPhone XS Max landscape
  { width: 1242, height: 2688, filename: 'splash-1242x2688.png' },  // iPhone XS Max portrait
  { width: 2778, height: 1284, filename: 'splash-2778x1284.png' },  // iPhone 12/13 Pro Max landscape
  { width: 1284, height: 2778, filename: 'splash-1284x2778.png' },  // iPhone 12/13 Pro Max portrait
  { width: 2532, height: 1170, filename: 'splash-2532x1170.png' },  // iPhone 12/13 Pro landscape
  { width: 1170, height: 2532, filename: 'splash-1170x2532.png' },  // iPhone 12/13 Pro portrait
  { width: 2048, height: 1536, filename: 'splash-2048x1536.png' },  // iPad landscape
  { width: 1536, height: 2048, filename: 'splash-1536x2048.png' },  // iPad portrait
  { width: 2732, height: 2048, filename: 'splash-2732x2048.png' },  // iPad Pro 12.9" landscape
  { width: 2048, height: 2732, filename: 'splash-2048x2732.png' },  // iPad Pro 12.9" portrait
];

// Generate a splash screen SVG with centered logo
const generateSplashSvg = (width, height) => {
  const logoSize = Math.min(width, height) * 0.3;
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = logoSize / 512;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="#0A0E1A"/>

    <!-- Centered Logo -->
    <g transform="translate(${centerX - logoSize/2}, ${centerY - logoSize/2}) scale(${scale})">
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
    <text x="${centerX}" y="${centerY + logoSize/2 + 60}"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, sans-serif"
          font-size="${Math.min(width, height) * 0.05}"
          font-weight="700"
          fill="#F8FAFC">RECOVER</text>
  </svg>`;
};

async function generateSplashScreens() {
  const splashDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/Splash.imageset');

  // Ensure directory exists
  if (!fs.existsSync(splashDir)) {
    fs.mkdirSync(splashDir, { recursive: true });
  }

  console.log('Generating iOS Splash Screens...\\n');

  const contents = {
    images: [],
    info: {
      author: 'xcode',
      version: 1,
    },
  };

  // Generate each splash screen size
  for (const size of splashSizes) {
    const svg = generateSplashSvg(size.width, size.height);

    await sharp(Buffer.from(svg))
      .png({ quality: 100 })
      .toFile(path.join(splashDir, size.filename));

    console.log(`✓ Created: ${size.filename}`);

    contents.images.push({
      filename: size.filename,
      idiom: 'universal',
    });
  }

  // Write Contents.json
  fs.writeFileSync(
    path.join(splashDir, 'Contents.json'),
    JSON.stringify(contents, null, 2)
  );
  console.log('\\n✓ Created: Contents.json');

  console.log('\\n✅ iOS Splash Screens generated successfully!');
}

generateSplashScreens().catch(console.error);
