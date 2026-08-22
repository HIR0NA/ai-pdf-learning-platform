const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  try {
    // Actually the JS SDK doesn't easily expose listModels directly.
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    let model = genAI.getGenerativeModel({ model: modelName });
    let result = await model.generateContent('Hi');
    console.log(`${modelName} works`, result.response.text().substring(0, 10));
  } catch (e) {
    console.error('flash-latest failed:', e.message);
  }
}
require('dotenv').config();
listModels();
