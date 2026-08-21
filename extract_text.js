const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');

async function run() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = await fsPromises.readdir(uploadsDir);
  
  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const textFile = path.join(uploadsDir, `${file}.txt`);
      if (!fs.existsSync(textFile)) {
        console.log(`Extracting text for ${file}...`);
        const buffer = await fsPromises.readFile(path.join(uploadsDir, file));
        try {
          const data = await pdfParse(buffer);
          await fsPromises.writeFile(textFile, data.text, 'utf-8');
          console.log(`Successfully extracted ${file}`);
        } catch (err) {
          console.error(`Failed to parse ${file}:`, err);
        }
      }
    }
  }
}

run().then(() => console.log('Done')).catch(console.error);
