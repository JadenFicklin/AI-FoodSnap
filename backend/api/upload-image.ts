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
  console.log('--- Handler start ---');
  console.log('Request method:', req.method);
  // CORS headers for debugging (allow all origins)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  console.log('CORS headers set');
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS preflight request received');
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  console.log('Parsing form data...');
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.log('Error parsing form data:', err);
      res.status(500).json({ error: 'Error parsing form data' });
      return;
    }
    console.log('Form fields:', fields);
    console.log('Form files:', files);
    const imageFile = files.image;
    if (!imageFile) {
      console.log('No image uploaded');
      res.status(400).json({ error: 'No image uploaded' });
      return;
    }
    const filePath = Array.isArray(imageFile)
      ? (imageFile[0] as any).filepath
      : (imageFile as any).filepath;
    console.log('Image file path:', filePath);
    try {
      const imageBuffer = fs.readFileSync(filePath);
      console.log('Image buffer read, size:', imageBuffer.length);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = Array.isArray(imageFile)
        ? (imageFile[0] as any).mimetype
        : (imageFile as any).mimetype;
      const dataUri = `data:${mimeType};base64,${base64Image}`;
      console.log('Data URI created, mimeType:', mimeType);
      try {
        console.log('Calling OpenAI API...');
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
        console.log('OpenAI API response received');
        let foods: any;
        try {
          foods = JSON.parse(completion.choices[0].message?.content || '[]');
          console.log('Parsed foods:', foods);
        } catch (e) {
          console.log('Error parsing OpenAI response:', e);
          foods = [];
        }
        res.status(200).json({ foods });
        console.log('Response sent with foods');
      } catch (error: any) {
        const message =
          error && typeof error === 'object' && 'message' in error
            ? error.message
            : 'Unknown error';
        console.log('Error from OpenAI API:', message);
        res.status(500).json({ error: message });
      }
    } catch (fileError) {
      console.log('Error reading image file:', fileError);
      res.status(500).json({ error: 'Error reading image file' });
    }
  });
  console.log('--- Handler end ---');
}
