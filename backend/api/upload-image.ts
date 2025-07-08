// @ts-ignore: Vercel provides these types at runtime
import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false
  }
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for Netlify frontend (set for every response)
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://ai-foodsnap.netlify.app'
  );
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Error parsing form data' });
      return;
    }
    const imageFile = files.image;
    if (!imageFile) {
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }
    const filePath = Array.isArray(imageFile)
      ? (imageFile[0] as any).filepath
      : (imageFile as any).filepath;
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = Array.isArray(imageFile)
      ? (imageFile[0] as any).mimetype
      : (imageFile as any).mimetype;
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    try {
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
      let foods: any;
      try {
        foods = JSON.parse(completion.choices[0].message?.content || '[]');
      } catch (e) {
        foods = [];
      }
      res.status(200).json({ foods });
    } catch (error: any) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? error.message
          : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });
}
