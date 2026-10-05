const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in .env.local');
    return;
  }

  console.log('Testing Gemini API with key:', apiKey.substring(0, 10) + '...');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Hello, are you working?');
    console.log('Response:', result.response.text());
    console.log('SUCCESS: Gemini API is working correctly!');
  } catch (error) {
    console.error('FAILURE: Gemini API Error:', error.message);
  }
}

testGemini();
