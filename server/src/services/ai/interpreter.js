const genAI = require("../../config/gemini");
const { queryDatabaseFunction } = require("./functionSchema");
const { QUERY_SYSTEM_PROMPT } = require("./promptTemplates");

async function interpretQuery(question, conversationContext = []) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: QUERY_SYSTEM_PROMPT,
    tools: [{ functionDeclarations: [queryDatabaseFunction] }],
    toolConfig: { functionCallingConfig: { mode: "ANY" } },
    generationConfig: { temperature: 0 },
  });

  const result = await model.generateContent(question);

  const candidates = result.response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("Gemini returned no candidates");
  }

  const parts = candidates[0].content.parts;
  const fcPart = parts.find((p) => p.functionCall);

  if (!fcPart) {
    throw new Error(
      "Gemini did not return a function call. Response text: " +
        (parts.find((p) => p.text)?.text || "(none)")
    );
  }

  if (fcPart.functionCall.name !== "query_database") {
    throw new Error(`Unexpected function call: ${fcPart.functionCall.name}`);
  }

  return fcPart.functionCall.args;
}

module.exports = { interpretQuery };
