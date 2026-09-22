/* Gera os ícones PNG do PWA (placeholder gradiente da marca Axiumlink).
   Uso: node tools/generate-icons.mjs  */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

/* --- encoder PNG mínimo (RGBA, sem dependências) --- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, pixelFn) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   /* bit depth */
  ihdr[9] = 6;   /* color type RGBA */
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; /* filtro: none */
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      raw[o++] = r; raw[o++] = g; raw[o++] = b; raw[o++] = a;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* --- arte: gradiente índigo com canto arredondado + link branco --- */
const C1 = [99, 102, 241];   /* #6366f1 */
const C2 = [79, 70, 229];    /* #4f46e5 */

function drawIcon(x, y, w, h) {
  const nx = x / (w - 1);
  const ny = y / (h - 1);

  /* fundo: gradiente diagonal */
  const t = (nx + ny) / 2;
  let r = Math.round(C1[0] + (C2[0] - C1[0]) * t);
  let g = Math.round(C1[1] + (C2[1] - C1[1]) * t);
  let b = Math.round(C1[2] + (C2[2] - C1[2]) * t);
  let a = 255;

  /* cantos arredondados (raio 22%) com alpha */
  const rad = 0.22;
  const cx = nx < rad ? rad : nx > 1 - rad ? 1 - rad : nx;
  const cy = ny < rad ? rad : ny > 1 - rad ? 1 - rad : ny;
  const dx = (nx - cx) / rad;
  const dy = (ny - cy) / rad;
  const outside = (nx < rad || nx > 1 - rad || ny < rad || ny > 1 - rad)
    ? Math.hypot(Math.max(Math.abs(nx - cx) / rad, 0), Math.max(Math.abs(ny - cy) / rad, 0))
    : 0;
  if (outside > 1) a = 0;
  else if (outside > 0.97) a = Math.round(255 * (1 - (outside - 0.97) / 0.03));

  /* glifo "link" (duas elipses brancas entrelaçadas) */
  const strokeW = 0.11;
  const e1 = { cx: 0.40, cy: 0.50, rx: 0.20, ry: 0.135, rot: -0.5 };
  const e2 = { cx: 0.60, cy: 0.50, rx: 0.20, ry: 0.135, rot: -0.5 };
  const onEllipse = (e) => {
    const ux = nx - e.cx;
    const uy = ny - e.cy;
    const cs = Math.cos(e.rot);
    const sn = Math.sin(e.rot);
    const lx = (ux * cs + uy * sn) / e.rx;
    const ly = (-ux * sn + uy * Math.cos(e.rot)) / e.ry;
    const d = Math.hypot(lx, ly);
    return d >= 1 - strokeW / e.rx && d <= 1 + strokeW / e.rx;
  };

  let glyph = false;
  /* banda central (junção) */
  if (onEllipse(e1) || onEllipse(e2)) glyph = true;

  if (glyph && a > 0) {
    r = 255; g = 255; b = 255;
    a = Math.round(a * 0.95);
  }

  return [r, g, b, a];
}

const sizes = [
  ['favicon-32x32.png', 32],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180]
];

for (const [name, size] of sizes) {
  const buf = png(size, size, drawIcon);
  writeFileSync(new URL('../' + name, import.meta.url), buf);
  console.log('gerado:', name, size + 'x' + size, buf.length + ' bytes');
}