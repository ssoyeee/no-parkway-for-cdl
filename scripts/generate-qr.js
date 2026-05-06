const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode-terminal/vendor/QRCode");
const QRErrorCorrectLevel = require("qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel");

const value = process.argv[2];
const outputPath = process.argv[3];

if (!value || !outputPath) {
  console.error("Usage: node scripts/generate-qr.js <value> <outputPath>");
  process.exit(1);
}

const qr = new QRCode(-1, QRErrorCorrectLevel.L);
qr.addData(value);
qr.make();

const count = qr.getModuleCount();
const cell = 12;
const margin = 4;
const size = (count + margin * 2) * cell;

let rects = "";

for (let row = 0; row < count; row += 1) {
  for (let col = 0; col < count; col += 1) {
    if (qr.isDark(row, col)) {
      const x = (col + margin) * cell;
      const y = (row + margin) * cell;
      rects += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#000"/>`;
    }
  }
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#fff"/>
  ${rects}
</svg>
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, svg, "utf8");
console.log(outputPath);
