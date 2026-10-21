import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([138, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(2, 9); // Truecolor RGB
  ihdrData.writeUInt8(0, 10); // Deflate
  ihdrData.writeUInt8(0, 11); // Filter 0
  ihdrData.writeUInt8(0, 12); // Interlace 0

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte per scanline
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      // Soft orange gradient with dark accents
      const border = 16;
      const isBorder = x < border || x >= width - border || y < border || y >= height - border;
      
      if (isBorder) {
        rawData[pixelOffset] = 234; // #ea580c
        rawData[pixelOffset + 1] = 88;
        rawData[pixelOffset + 2] = 12;
      } else {
        // Inner gradient
        const t = y / height;
        rawData[pixelOffset] = Math.round(234 + (249 - 234) * t);
        rawData[pixelOffset + 1] = Math.round(88 + (115 - 88) * t);
        rawData[pixelOffset + 2] = Math.round(12 + (22 - 12) * t);
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

const table = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? -306674912 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c;
}

// Generate PWA icons
fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, 234, 88, 12));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, 234, 88, 12));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, 234, 88, 12));
fs.writeFileSync('public/favicon.ico', createPNG(32, 32, 234, 88, 12));

console.log('Successfully generated PWA icons in public/');
