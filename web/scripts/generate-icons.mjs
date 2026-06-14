// Rasterize TradePilot SVG marks into the required PNG icon set.
// Uses sharp (already a devDependency) — no headless browser needed.
//
// Outputs:
//   public/icons/pwa-192.png          (logo-source.svg @ 192×192)
//   public/icons/pwa-512.png          (logo-source.svg @ 512×512)
//   public/icons/pwa-maskable-512.png (maskable-source.svg @ 512×512)
//   public/apple-touch-icon.png       (logo-source.svg @ 180×180)
//   public/favicon.ico                (32×32 PNG written as .ico — close enough for
//                                      browsers; true multi-res .ico skipped, noted
//                                      as follow-up)

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

const logoSvg = readFileSync(resolve(publicDir, 'icons/logo-source.svg'));
const maskableSvg = readFileSync(resolve(publicDir, 'icons/maskable-source.svg'));

const jobs = [
  { src: logoSvg,     size: 192, dest: resolve(publicDir, 'icons/pwa-192.png') },
  { src: logoSvg,     size: 512, dest: resolve(publicDir, 'icons/pwa-512.png') },
  { src: maskableSvg, size: 512, dest: resolve(publicDir, 'icons/pwa-maskable-512.png') },
  { src: logoSvg,     size: 180, dest: resolve(publicDir, 'apple-touch-icon.png') },
  { src: logoSvg,     size: 32,  dest: resolve(publicDir, 'favicon.ico') },
];

for (const { src, size, dest } of jobs) {
  await sharp(src)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(dest);
  console.log(`Generated ${dest.replace(root + '/', '')} (${size}×${size})`);
}

console.log('Done.');
