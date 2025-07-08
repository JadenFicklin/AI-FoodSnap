# Backend Server

This is a minimal Express server for securely handling OpenAI API requests.

## Setup

1. Ensure you have your `OPENAI_API_KEY` in the project root `.env` file.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   npm run dev:backend
   ```

## Test the Endpoint

Send a POST request to `http://localhost:3001/api/analyze-text` with JSON body:

```json
{
  "text": "Describe a bowl of oatmeal with banana and honey."
}
```

You should receive a response from OpenAI with the analysis.
