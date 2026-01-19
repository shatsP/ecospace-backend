import { GoogleGenAI } from "@google/genai";
import { buildPrompt, AnalysisResult } from "./prom";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_GEMINI_API_KEY! });
const MODEL = "gemma-3n-e2b-it";

function parseAndValidateResponse(text: string): AnalysisResult {
  // Extract JSON from response (handle markdown code blocks if present)
  let jsonString = text.trim();
  if (jsonString.startsWith("```json")) {
    jsonString = jsonString.slice(7);
  } else if (jsonString.startsWith("```")) {
    jsonString = jsonString.slice(3);
  }
  if (jsonString.endsWith("```")) {
    jsonString = jsonString.slice(0, -3);
  }
  jsonString = jsonString.trim();

  const parsed = JSON.parse(jsonString);

  // Validate required structure
  if (!parsed.summary || typeof parsed.summary !== "object") {
    throw new Error("Invalid response: missing summary object");
  }
  if (typeof parsed.summary.status !== "string") {
    throw new Error("Invalid response: missing summary.status");
  }
  if (!Array.isArray(parsed.syntaxErrors)) {
    throw new Error("Invalid response: syntaxErrors must be an array");
  }
  if (!Array.isArray(parsed.logicErrors)) {
    throw new Error("Invalid response: logicErrors must be an array");
  }
  if (!Array.isArray(parsed.securityIssues)) {
    throw new Error("Invalid response: securityIssues must be an array");
  }

  return parsed as AnalysisResult;
}

export async function getLLMFallbackResponse(
  fileName: string | undefined,
  code: string
): Promise<AnalysisResult> {
  const prompt = buildPrompt(fileName, code);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [prompt],
  });

  const text = response.text;
  if (!text) {
    throw new Error("LLM returned empty response");
  }

  console.log("[LLM Raw Response]", text);

  return parseAndValidateResponse(text);
}
