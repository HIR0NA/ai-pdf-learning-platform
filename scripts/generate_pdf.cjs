const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const candidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const browser = candidates.find(p => fs.existsSync(p));
if (!browser) {
  console.error('No Chrome or Edge found.');
  process.exit(1);
}

const htmlPath = path.resolve(__dirname, '..', 'DevSecOps_Security_Progress_Report.html');
const pdfPath = path.resolve(__dirname, '..', 'DevSecOps_Security_Progress_Report.pdf');

console.log(`Using browser: ${browser}`);
console.log(`HTML path: ${htmlPath}`);
console.log(`PDF path: ${pdfPath}`);

try {
  execFileSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    `--print-to-pdf=${pdfPath}`,
    htmlPath
  ], { stdio: 'inherit', timeout: 30000 });

  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`SUCCESS: PDF generated successfully! (${stats.size} bytes)`);
  } else {
    console.error('FAIL: PDF file not found after generation.');
    process.exit(1);
  }
} catch (err) {
  console.error('Error generating PDF:', err);
  process.exit(1);
}
