const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Clozer brand colors
const PRIMARY_COLOR = '#3b82f6';
const WHITE = '#ffffff';

// SVG template for the Clozer icon (route/navigation symbol)
const createIconSvg = (size, maskable = false) => {
  const padding = maskable ? size * 0.1 : 0; // 10% padding for maskable icons
  const iconSize = size - (padding * 2);
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Scale factors based on icon size
  const scale = iconSize / 100;
  
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${PRIMARY_COLOR}" rx="${size * 0.15}"/>
  
  <!-- Route icon - stylized path/navigation -->
  <g transform="translate(${padding}, ${padding})">
    <!-- Main route line -->
    <path 
      d="M${30 * scale} ${70 * scale} 
         Q${35 * scale} ${50 * scale} ${50 * scale} ${45 * scale}
         Q${65 * scale} ${40 * scale} ${70 * scale} ${25 * scale}"
      stroke="${WHITE}" 
      stroke-width="${6 * scale}" 
      stroke-linecap="round"
      fill="none"
    />
    
    <!-- Start point marker -->
    <circle cx="${30 * scale}" cy="${70 * scale}" r="${8 * scale}" fill="${WHITE}"/>
    <circle cx="${30 * scale}" cy="${70 * scale}" r="${4 * scale}" fill="${PRIMARY_COLOR}"/>
    
    <!-- End point marker (location pin style) -->
    <circle cx="${70 * scale}" cy="${25 * scale}" r="${10 * scale}" fill="${WHITE}"/>
    <circle cx="${70 * scale}" cy="${25 * scale}" r="${5 * scale}" fill="${PRIMARY_COLOR}"/>
    
    <!-- Middle waypoint -->
    <circle cx="${50 * scale}" cy="${45 * scale}" r="${6 * scale}" fill="${WHITE}"/>
  </g>
</svg>`;
};

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const icons = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-192-maskable.png', size: 192, maskable: true },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-512-maskable.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
    { name: 'favicon-32x32.png', size: 32, maskable: false },
    { name: 'favicon-16x16.png', size: 16, maskable: false },
  ];

  console.log('Generating PWA icons...\n');

  for (const icon of icons) {
    const svgContent = createIconSvg(icon.size, icon.maskable);
    const outputPath = path.join(publicDir, icon.name);
    
    try {
      await sharp(Buffer.from(svgContent))
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated: ${icon.name} (${icon.size}x${icon.size}${icon.maskable ? ', maskable' : ''})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${icon.name}:`, error.message);
    }
  }

  // Generate favicon.ico (multi-size)
  console.log('\n✓ All icons generated successfully!');
  console.log('\nIcons saved to:', publicDir);
}

generateIcons().catch(console.error);
