const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Using API Key starting with:", apiKey.substring(0, 5));
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Attempt to list models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
        console.error("HTTP Error:", response.status, await response.text());
        return;
    }
    const data = await response.json();
    console.log("Available models:");
    data.models.forEach(m => console.log(`- ${m.name}`));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
