import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-05-20",
    contents: "Explain how AI works in a few words",
  });
  console.log(response.text);
}

await main();