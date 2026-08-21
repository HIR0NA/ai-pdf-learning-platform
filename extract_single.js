const fs = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');

async function run() {
  const fileName = process.argv[2];
  if (!fileName) return;

  const uploadDir = path.join(process.cwd(), 'uploads');
  const filePath = path.join(uploadDir, fileName);
  const textPath = path.join(uploadDir, `${fileName}.txt`);

  try {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    await fs.writeFile(textPath, data.text, 'utf-8');
    console.log(`Extracted text for ${fileName}`);
  } catch (err) {
    console.error(`Failed to parse ${fileName}:`, err);
  }
}

run();
