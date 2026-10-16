import fs from "node:fs";
import sharp from "sharp";
fs.mkdirSync("public/icons", { recursive: true });
const svg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="100" fill="#0b0b12"/><circle cx="256" cy="256" r="170" fill="#9662ff"/><path d="M180 220h150M235 160v180M180 340h150" fill="none" stroke="#b3ff4a" stroke-width="35" stroke-linecap="round"/></svg>`,
);
for (const n of [192, 512])
  await sharp(svg).resize(n, n).png().toFile(`public/icons/icon-${n}.png`);
fs.copyFileSync("public/icons/icon-512.png", "public/icons/maskable-512.png");
