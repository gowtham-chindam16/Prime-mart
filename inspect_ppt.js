const AdmZip = require('adm-zip');
const fs = require('fs');
const zip = new AdmZip('ppt/final ppt IV cic.pptx');
const slideNumber = process.argv[2] || '4';
const entryName = `ppt/slides/slide${slideNumber}.xml`;
const entry = zip.getEntry(entryName);
if (!entry) {
  console.error('Slide not found:', entryName);
  process.exit(1);
}
const text = entry.getData().toString('utf8');
console.log(`--- SLIDE ${slideNumber} text nodes ---`);
const regex = /<a:t>(.*?)<\/a:t>/gms;
let match;
const lines = [];
while ((match = regex.exec(text)) !== null) {
  lines.push(match[1]);
}
console.log(lines.join('\n'));
console.log('--- end ---');
