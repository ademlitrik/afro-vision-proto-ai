import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconDir = path.resolve('assets/icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="100" fill="#111214"/>
  <circle cx="256" cy="256" r="180" fill="#1c1e22" stroke="#2a2d34" stroke-width="8"/>
  <circle cx="256" cy="256" r="90" fill="#26282e" stroke="#e2a439" stroke-width="16"/>
  <polygon points="256,120 340,200 300,320 180,300" fill="none" stroke="#e2a439" stroke-width="10"/>
  <circle cx="256" cy="256" r="30" fill="#e2a439"/>
</svg>
`;

async function main() {
  await sharp(Buffer.from(svg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconDir, 'icon.png'));
  console.log('App icon generated successfully at assets/icons/icon.png');
}

main().catch(console.error);
