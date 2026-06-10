const AdmZip = require('adm-zip');
const zip = new AdmZip('ppt/final ppt IV cic.pptx');
const slideNumber = process.argv[2] || '2';
const entryName = `ppt/slides/slide${slideNumber}.xml`;
const entry = zip.getEntry(entryName);
if (!entry) {
  console.error('Slide not found:', entryName);
  process.exit(1);
}
const text = entry.getData().toString('utf8');
const shapeRegex = /<p:sp([\s\S]*?)<\/p:sp>/g;
let match;
let idx = 0;
while ((match = shapeRegex.exec(text)) !== null) {
  idx += 1;
  const shape = match[0];
  const nameMatch = shape.match(/name="([^"]*)"/);
  const typeMatch = shape.match(/<p:ph[^>]*type="([^"]*)"/);
  const idxMatch = shape.match(/idx="([^"]*)"/);
  const textMatch = [...shape.matchAll(/<a:t>(.*?)<\/a:t>/g)].map(m => m[1]).join(' | ');
  console.log(`Shape ${idx}: name=${nameMatch?.[1]||''} type=${typeMatch?.[1]||''} idx=${idxMatch?.[1]||''}`);
  console.log(`  text=${textMatch}`);
}
