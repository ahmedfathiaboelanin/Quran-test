import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = await readFile(new URL('../public/favicon.svg', import.meta.url));

const outputs = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

for (const { file, size } of outputs) {
  const outputPath = fileURLToPath(new URL(`../public/${file}`, import.meta.url));
  await sharp(source, { density: 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`Generated public/${file}`);
}
