const pdfParse = require('pdf-parse');
const fs = require('fs');
async function test() {
  const buf = fs.readFileSync('uploads/96577fb9-14ab-4421-912d-f035c77fe9ec.pdf');
  try {
    console.log(typeof pdfParse);
    const data = await pdfParse(buf);
    console.log(data.text.substring(0, 50));
  } catch (e) {
    console.log('Error:', e);
  }
}
test();
