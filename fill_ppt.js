const AdmZip = require('adm-zip');
const path = require('path');
const filePath = path.join(__dirname, 'ppt', 'final ppt IV cic.pptx');
const backupPath = path.join(__dirname, 'ppt', 'final ppt IV cic-backup.pptx');
const zip = new AdmZip(filePath);
zip.writeZip(backupPath);

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
    }
  });
}

function replaceNth(str, search, replacement, n) {
  let i = 0;
  return str.replace(new RegExp(search, 'g'), (match) => {
    i += 1;
    return i === n ? replacement : match;
  });
}

function makeParagraph(text) {
  return `<a:p><a:r><a:rPr dirty="0"/><a:t>${escapeXml(text)}</a:t></a:r><a:endParaRPr lang="en-IN" dirty="0"/></a:p>`;
}

function makeParagraphs(lines) {
  return lines.map(makeParagraph).join('');
}

function fillTableRow(rowXml, leftText, rightText) {
  const leftCellXml = `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${makeParagraph(leftText)}</a:txBody><a:tcPr/></a:tc>`;
  const rightCellXml = `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${makeParagraph(rightText)}</a:txBody><a:tcPr/></a:tc>`;
  rowXml = rowXml.replace(/<a:tc>[\s\S]*?<a:tcPr\/>/, leftCellXml);
  rowXml = rowXml.replace(/<a:tc>[\s\S]*?<a:tcPr\/>\s*(?=<a:extLst>)/, rightCellXml);
  return rowXml;
}

function updateSlide(slideName, updater) {
  const entry = zip.getEntry(slideName);
  if (!entry) {
    console.error('Missing slide:', slideName);
    process.exit(1);
  }
  let xml = entry.getData().toString('utf8');
  xml = updater(xml);
  zip.updateFile(slideName, Buffer.from(xml, 'utf8'));
}

function replaceFirst(xml, from, to) {
  return xml.replace(from, to);
}

// Slide 2 - Problem Statement table
updateSlide('ppt/slides/slide2.xml', (xml) => {
  xml = xml.replace('E-</a:t></a:r><a:r><a:rPr lang="en-US" dirty="0" err="1"/><a:t>commerse</a:t></a:r><a:r><a:rPr lang="en-US" dirty="0"/><a:t> /Online Retail</a:t>', '<a:r><a:rPr lang="en-US" dirty="0"/><a:t>E-commerce / Online Retail</a:t></a:r>');
  // Fill blank rows with project-specific information
  const blankRowRegex = /<a:tr[^>]*>[\s\S]*?<a:extLst>[\s\S]*?<\/a:tr>/g;
  const rowReplacements = [
    { left: 'Target Users', right: 'Students, professionals, and online shoppers' },
    { left: 'Key Features', right: 'Search, filter, cart management, checkout' },
    { left: 'Data Storage', right: 'Products, carts, orders stored in Firebase Firestore' },
    { left: 'Security', right: 'Secure login with Firebase Authentication' },
    { left: 'Deployment', right: 'Static browser app hosted from local / any web server' }
  ];
  let rowIndex = -1;
  xml = xml.replace(blankRowRegex, (row) => {
    rowIndex += 1;
    if (rowIndex === 0 || rowIndex === 1) {
      return row;
    }
    const content = rowReplacements[rowIndex - 2];
    return content ? fillTableRow(row, content.left, content.right) : row;
  });
  return xml;
});

// Slide 3 - Project Overview
updateSlide('ppt/slides/slide3.xml', (xml) => {
  const titleParagraph = makeParagraph('Project Overview');
  xml = replaceNth(xml, '<a:p><a:endParaRPr lang="en-IN"/></a:p>', titleParagraph, 1);
  const bodyParagraphs = makeParagraphs([
    'Online shopping platform built with Firebase and web technologies',
    'Provides login, product discovery, cart, and checkout workflows',
    'Stores users, products, cart items, and orders in Firestore',
    'Responsive UI with search, categories, and payment options'
  ]);
  xml = replaceNth(xml, '<a:p><a:endParaRPr lang="en-IN"/></a:p>', bodyParagraphs, 2);
  return xml;
});

// Slide 4 - Application Areas and Challenges
updateSlide('ppt/slides/slide4.xml', (xml) => {
  const content = makeParagraphs([
    'Application Areas: Electronics, Clothing, Home, Sports, Accessories',
    'Supports product search, category filtering, and cart checkout',
    'Challenges: secure authentication, cart persistence, payment flow'
  ]);
  xml = xml.replace(/<a:spPr>[\s\S]*?<a:txBody>[\s\S]*?<\/a:sp>/, (match) => {
    if (match.includes('<a:t>Application</a:t>')) {
      return match.replace(/<a:txBody>[\s\S]*?<\/a:txBody>/, `<a:txBody><a:bodyPr vert="horz" wrap="square" lIns="0" tIns="12700" rIns="0" bIns="0" rtlCol="0"><a:spAutoFit/></a:bodyPr><a:lstStyle/>${content}</a:txBody>`);
    }
    return match;
  });
  return xml;
});

// Slide 5 - Software/Hardware requirements table
updateSlide('ppt/slides/slide5.xml', (xml) => {
  const blankRowRegex = /<a:tr[^>]*>[\s\S]*?<a:extLst>[\s\S]*?<\/a:tr>/g;
  const rowReplacements = [
    { left: 'Firebase', right: 'Authentication, Firestore backend, data persistence' },
    { left: 'HTML/CSS', right: 'User interface structure and responsive design' },
    { left: 'JavaScript', right: 'Frontend logic, interactions, and cart management' },
    { left: 'QR Code API', right: 'Generate payment QR codes for checkout flow' },
    { left: 'Browser', right: 'Runs the app pages and executes client-side code' },
    { left: 'VS Code', right: 'Development environment for editing the project' }
  ];
  let rowIndex = -1;
  xml = xml.replace(blankRowRegex, (row) => {
    rowIndex += 1;
    if (rowIndex === 0) {
      return row;
    }
    const content = rowReplacements[rowIndex - 1];
    return content ? fillTableRow(row, content.left, content.right) : row;
  });
  return xml;
});

// Slide 6 - Certifications details
updateSlide('ppt/slides/slide6.xml', (xml) => {
  xml = xml.replace('&lt;&lt;details&gt;&gt;', 'Firebase Authentication and Firestore integration');
  xml = xml.replace('&lt;&lt;details&gt;&gt;', 'Responsive frontend with secure cart checkout');
  return xml;
});

// Slide 7 - I/O Specifications
updateSlide('ppt/slides/slide7.xml', (xml) => {
  const titleText = 'I/O Specifications:';
  xml = xml.replace(/<a:t>I\/O<\/a:t>\s*<\/a:r><a:r>[\s\S]*?<\/a:r><\/a:p>/, `<a:t>${escapeXml(titleText)}</a:t></a:r></a:p>${makeParagraph('Input: login, search, add to cart, checkout')}${makeParagraph('Output: product list, cart summary, order confirmation')}`);
  return xml;
});

// Slide 8 - Proposed System Architecture
updateSlide('ppt/slides/slide8.xml', (xml) => {
  const replacement = makeParagraphs([
    'Browser UI interacts with Firebase Authentication and Firestore',
    'Firebase Auth secures user registration and login',
    'Firestore stores products, carts, and order records',
    'Checkout generates payment QR and saves order details'
  ]);
  xml = xml.replace(/&lt;&lt;[\s\S]*?Block[\s\S]*?Chart&gt;&gt;/, replacement);
  return xml;
});

// Slide 9 - System Design use-case title
updateSlide('ppt/slides/slide9.xml', (xml) => {
  const newTitle = `Use-case: User login, browse products, add to cart, checkout`;
  xml = xml.replace(/<a:p>[\s\S]*?<a:t>diagram<\/a:t><\/a:r><\/a:p>/, `<a:p><a:r><a:rPr dirty="0"/><a:t>${escapeXml(newTitle)}</a:t></a:r></a:p>`);
  return xml;
});

// Slide 10 - Module description table
updateSlide('ppt/slides/slide10.xml', (xml) => {
  const blankRowRegex = /<a:tr[^>]*>[\s\S]*?<a:extLst>[\s\S]*?<\/a:tr>/g;
  const rowReplacements = [
    { left: 'Authentication Module', right: 'Email/password and social login using Firebase Auth' },
    { left: 'Product Catalog Module', right: 'Display, search, and filter products' },
    { left: 'Cart Module', right: 'Add, remove, and update product quantities' },
    { left: 'Checkout Module', right: 'Order summary, payment selection, and confirmation' },
    { left: 'Order Module', right: 'Save orders to Firestore and clear cart afterward' },
    { left: 'UI Module', right: 'Responsive pages for home, auth, cart, and payment' }
  ];
  let rowIndex = -1;
  xml = xml.replace(blankRowRegex, (row) => {
    rowIndex += 1;
    if (rowIndex === 0) {
      return row;
    }
    const content = rowReplacements[rowIndex - 1];
    return content ? fillTableRow(row, content.left, content.right) : row;
  });
  return xml;
});

// Slide 11 - Implementation hints and details
updateSlide('ppt/slides/slide11.xml', (xml) => {
  const replacement = makeParagraphs([
    'Built with VS Code using HTML, CSS, and JavaScript',
    'Uses Firebase Auth and Firestore for backend services',
    'Runs fully in the browser with client-side logic'
  ]);
  xml = xml.replace(/&lt;&lt;[\s\S]*?Screenshots[\s\S]*?Photographs[\s\S]*?&gt;&gt;/, replacement);
  return xml;
});

// Slide 12 - Testing results
updateSlide('ppt/slides/slide12.xml', (xml) => {
  const replacement = makeParagraphs([
    'Verified registration, login, and social authentication',
    'Tested product search, category filters, and cart updates',
    'Validated checkout flow with QR and COD payment options',
    'Confirmed orders persisted in Firestore/localStorage'
  ]);
  xml = xml.replace(/&lt;&lt;[\s\S]*?Screenshots[\s\S]*?Photographs[\s\S]*?&gt;&gt;/, replacement);
  return xml;
});

// Slide 13 - Conclusion & Future Enhancements
updateSlide('ppt/slides/slide13.xml', (xml) => {
  const titleText = 'Conclusion & Future Enhancements';
  const body = makeParagraphs([
    'PrimeMart provides a complete online shopping experience',
    'Future enhancements: payment gateway, admin panel, order tracking'
  ]);
  xml = xml.replace(/<a:p>[\s\S]*?<a:t>Enhancements<\/a:t><\/a:r><\/a:p>/, `<a:p><a:r><a:rPr dirty="0"/><a:t>${escapeXml(titleText)}</a:t></a:r></a:p>${body}`);
  return xml;
});

// Slide 14 - References
updateSlide('ppt/slides/slide14.xml', (xml) => {
  const body = makeParagraphs([
    'Firebase JavaScript SDK',
    'HTML, CSS, JavaScript, and browser APIs',
    'VS Code and web technologies for development'
  ]);
  xml = xml.replace(/<a:p>[\s\S]*?<a:t>References<\/a:t><\/a:r><\/a:p>/, `<a:p><a:r><a:rPr dirty="0"/><a:t>References</a:t></a:r></a:p>${body}`);
  return xml;
});

zip.writeZip(filePath);
console.log('Filled PPTX saved to', filePath);
console.log('Backup created at', backupPath);
