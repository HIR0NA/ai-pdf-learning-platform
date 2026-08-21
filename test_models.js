const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  try {
    // Actually the JS SDK doesn't easily expose listModels directly.
    // Let's just try testing "gemini-1.5-flash-latest" vs "gemini-1.5-pro"
    let model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    let result = await model.generateContent('Hi');
    console.log('gemini-1.5-flash-latest works', result.response.text().substring(0, 10));
  } catch (e) {
    console.error('flash-latest failed:', e.message);
  }
}
require('dotenv').config();
listModels();
