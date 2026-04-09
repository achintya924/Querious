const OpenAI = require("openai");

if (!process.env.AI_API_KEY) {
  throw new Error("AI_API_KEY is not set in environment variables");
}

const aiClient = new OpenAI({
  apiKey:  process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL || "https://openrouter.ai/api/v1",
});

module.exports = aiClient;
