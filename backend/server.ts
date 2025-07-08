const express = require('express');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const upload = multer({ dest: 'uploads/' });

app.use(cors({ origin: 'http://localhost:5173' }));

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

// Image upload and analysis endpoint
app.post(
  '/api/upload-image',
  upload.single('image'),
  async (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    try {
      // Read the image file and encode as base64
      const imagePath = req.file.path;
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      // Call OpenAI Vision (GPT-4 with vision)
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a nutritionist. Analyze the food in the image and return a JSON object with food name, estimated calories, macronutrients (protein, carbs, fat), and micronutrients if possible.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food image and return nutrition info as JSON.'
              },
              { type: 'image_url', image_url: { url: dataUri } }
            ]
          }
        ],
        max_tokens: 500
      });

      // Remove the uploaded file after processing
      fs.unlinkSync(imagePath);

      // Try to parse the JSON from the response
      let nutrition = null;
      try {
        nutrition = JSON.parse(completion.choices[0].message?.content || '{}');
      } catch (e) {
        nutrition = { raw: completion.choices[0].message?.content };
      }

      res.json({
        analysis: nutrition
      });
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? error.message
          : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
);

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
