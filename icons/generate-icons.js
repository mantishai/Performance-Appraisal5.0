const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function createIcon(size) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1890ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#096dd9;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="${size - 8}" height="${size - 8}" rx="${size * 0.1}" ry="${size * 0.1}" fill="url(#grad${size})"/>
  <text x="${size/2}" y="${size/2 + size*0.15}" font-family="Arial" font-size="${size*0.35}" fill="white" text-anchor="middle" font-weight="bold">HR</text>
</svg>`;
    return svg;
}

const iconsDir = __dirname;

sizes.forEach(size => {
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(iconsDir, filename);
    fs.writeFileSync(filepath, createIcon(size));
    console.log(`Created ${filename}`);
});

console.log('All icons generated successfully!');