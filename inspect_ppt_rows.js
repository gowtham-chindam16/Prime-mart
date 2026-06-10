const AdmZip = require('adm-zip');
const slideNumber = process.argv[2] || '10';
const zip = new AdmZip('ppt/final ppt IV cic.pptx');
const entry = zip.getEntry(`ppt/slides/slide${slideNumber}.xml`);
if (!entry) {
  console.error('Slide not found');
  process.exit(1);
}
const text = entry.getData().toString('utf8');
const rows = text.split('<a:tr').slice(1);
console.log(`Slide ${slideNumber} has ${rows.length} <a:tr> rows`);
const textRegex = new RegExp('<a:t>(.*?)<\\/a:t>', 'g');
rows.forEach((row, idx) => {
  const cells = row.split('<a:tc').slice(1);
  const cellTexts = cells.map(cell => {
    const matches = [...cell.matchAll(textRegex)];
    return matches.map(m => m[1]).join(' | ');
  });
  console.log(`ROW ${idx}: ${cellTexts.join(' || ')}`);
  if (idx < 3) {
    console.log('RAW ROW', idx, row.substring(0, 1200).replace(/\n/g, ' '));
  }
});
