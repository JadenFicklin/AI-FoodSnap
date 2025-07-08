const express = require('express');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.get('/', (req: any, res: any) => {
  res.json({ message: 'Backend server is running!' });
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get('/api/test-openai', async (req: any, res: any) => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello!' }
      ]
    });
    res.json({ result: completion.choices[0].message?.content });
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? error.message
        : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
