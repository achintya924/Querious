const OpenAI = require("openai");

if (!process.env.GROK_API_KEY) {
  throw new Error("GROK_API_KEY is not set in environment variables");
}

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

module.exports = grok;
