const express = require('express');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

const upload = multer({ dest: 'uploads/' });

app.use(
  cors({ origin: ['http://localhost:5173', 'https://ai-foodsnap.netlify.app'] })
);
app.use(express.json());

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
              'You are a food recognition expert. Analyze the food in the image and return a JSON array, where each item is an object with the fields: food (the name of the food you see) and grams (your best guess of the amount in grams). Be as specific as possible: list each distinct food item separately (e.g., "strawberries", "blueberries", etc. instead of "berries"). Do not group foods under generic terms. Do not return N/A or unknown; always provide your best guess for both fields, even if you are uncertain.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'List all foods you see in this image and estimate the amount in grams for each. Return as a JSON array.'
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
      let foods = null;
      try {
        foods = JSON.parse(completion.choices[0].message?.content || '[]');
      } catch (e) {
        foods = { raw: completion.choices[0].message?.content };
      }

      res.json({
        foods: foods
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

// Nutrient sheet endpoint
app.post('/api/openai-nutrient-sheet', async (req: any, res: any) => {
  const { foods } = req.body;
  if (!Array.isArray(foods) || foods.length === 0) {
    return res.status(400).json({ error: 'Foods array is required' });
  }
  try {
    const foodList = foods.map((f) => `${f.food} (${f.grams}g)`).join(', ');
    const exampleJson = `{"totals": {"macronutrients": {"calories": 617, "protein": 11.5, "fats": 24.3, "carbohydrates": 89.2, "fiber": 4.1, "sugar": 28.9}, "micronutrients": {"calcium_mg": 133.5, "iron_mg": 3.6, "magnesium_mg": 53.4, "phosphorus_mg": 162.2, "potassium_mg": 347.8, "sodium_mg": 431.1, "zinc_mg": 1.8, "copper_mg": 0.4, "manganese_mg": 1.5, "selenium_ug": 10.2, "vitamin_a_ug": 135.7, "vitamin_b1_mg": 0.3, "vitamin_b2_mg": 0.3, "vitamin_b3_mg": 3.1, "vitamin_b5_mg": 0.6, "vitamin_b6_mg": 0.2, "vitamin_b12_ug": 0.2, "vitamin_c_mg": 13.1, "vitamin_d_ug": 0, "vitamin_e_mg": 0.6, "vitamin_k_ug": 7.9, "folate_ug": 42.5, "cholesterol_mg": 39.1}}}`;
    const prompt = `For the following foods and their amounts in grams, provide ONLY the total sum of every macronutrient and every micronutrient contributed by all foods combined. Use the EXACT JSON format and keys below, with the same units and all fields present (even if zero). Do not add or remove any fields. Respond in JSON only, no explanation. Example format: ${exampleJson} Foods: ${foodList}`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert. Given a list of foods and their amounts in grams, return ONLY the total sum of every macronutrient and every micronutrient contributed by all foods combined. Use the EXACT JSON format and keys below, with the same units and all fields present (even if zero). Do not add or remove any fields. Respond in JSON only, no explanation. Example format: ${exampleJson}`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000
    });
    let result = null;
    let content = completion.choices[0].message?.content || '{}';
    // Try to extract JSON from markdown code block if present
    const match = content.match(/```json\s*([\s\S]*?)```/i);
    if (match) {
      content = match[1];
    }
    try {
      result = JSON.parse(content);
    } catch (e) {
      result = { raw: completion.choices[0].message?.content };
    }
    // Ensure result has totals field only
    if (!result || typeof result !== 'object') {
      result = { totals: { macronutrients: {}, micronutrients: {} } };
    } else {
      if (!result.totals || typeof result.totals !== 'object') {
        result.totals = { macronutrients: {}, micronutrients: {} };
      } else {
        if (
          !result.totals.macronutrients ||
          typeof result.totals.macronutrients !== 'object'
        )
          result.totals.macronutrients = {};
        if (
          !result.totals.micronutrients ||
          typeof result.totals.micronutrients !== 'object'
        )
          result.totals.micronutrients = {};
      }
    }
    res.json(result);
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
