const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = await fsPromises.readdir(uploadsDir);
  
  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const indexFile = path.join(uploadsDir, `${file}.index.json`);
      if (!fs.existsSync(indexFile)) {
        console.log(`Indexing ${file}...`);
        const buffer = await fsPromises.readFile(path.join(uploadsDir, file));
        try {
          const data = await pdfParse(buffer);
          const text = data.text;
          
          const chunks = text.match(/[\s\S]{1,1000}/g) || [];
          const embeddingsData = [];
          
          for (const chunk of chunks) {
            try {
              const result = await model.embedContent(chunk);
              embeddingsData.push({ text: chunk, values: result.embedding.values });
            } catch (e) {
              console.error("Embedding error:", e);
            }
          }
          
          await fsPromises.writeFile(indexFile, JSON.stringify(embeddingsData));
          console.log(`Successfully indexed ${file}`);
        } catch (err) {
          console.error(`Failed to parse ${file}:`, err);
        }
      }
    }
  }
}

run().then(() => console.log('Done')).catch(console.error);
