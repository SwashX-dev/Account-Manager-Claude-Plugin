// Deterministic ZIP (stored entries), using only Node's standard library.
const fs = require('node:fs');
const path = require('node:path');
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const entries = []; const central = []; let offset = 0;
for (const file of fs.readdirSync('extension').sort()) {
  if (!fs.statSync(path.join('extension', file)).isFile()) throw new Error('Unexpected subdirectory in extension');
  const name = Buffer.from(file); const data = fs.readFileSync(path.join('extension', file)); const crc = crc32(data);
  const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x21, 12);
  header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26);
  const dir = Buffer.alloc(46); dir.writeUInt32LE(0x02014b50, 0); dir.writeUInt16LE(20, 4); dir.writeUInt16LE(20, 6); dir.writeUInt16LE(0x21, 14);
  dir.writeUInt32LE(crc, 16); dir.writeUInt32LE(data.length, 20); dir.writeUInt32LE(data.length, 24); dir.writeUInt16LE(name.length, 28); dir.writeUInt32LE(offset, 42);
  entries.push(header, name, data); central.push(dir, name); offset += header.length + name.length + data.length;
}
const directory = Buffer.concat(central); const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
fs.mkdirSync('dist', { recursive: true });
const destination = 'dist/claude-account-manager-0.1.0-unsigned.zip';
fs.writeFileSync(destination, Buffer.concat([...entries, directory, end])); console.log(destination);
