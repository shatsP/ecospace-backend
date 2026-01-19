import { GoogleGenAI } from "@google/genai";
import { buildPrompt, AnalysisResult } from "./prompt";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_GEMINI_API_KEY! });

// Model can be configured via environment variable
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

/**
 * Extract JSON from LLM response, handling markdown code blocks
 */
function extractJSON(text: string): string {
  let jsonString = text.trim();
  
  // Handle ```json blocks
  if (jsonString.startsWith("```json")) {
    jsonString = jsonString.slice(7);
  } else if (jsonString.startsWith("```")) {
    jsonString = jsonString.slice(3);
  }
  
  if (jsonString.endsWith("```")) {
    jsonString = jsonString.slice(0, -3);
  }
  
  return jsonString.trim();
}

/**
 * Validate array field exists and is an array
 */
function validateArrayField(obj: Record<string, unknown>, field: string): void {
  if (!Array.isArray(obj[field])) {
    throw new Error(`Invalid response: ${field} must be an array`);
  }
}

/**
 * Parse and validate LLM response against expected schema
 */
function parseAndValidateResponse(text: string): AnalysisResult {
  const jsonString = extractJSON(text);
  const parsed = JSON.parse(jsonString);

  // Validate summary object
  if (!parsed.summary || typeof parsed.summary !== "object") {
    throw new Error("Invalid response: missing summary object");
  }
  
  const { summary } = parsed;
  
  // Validate summary fields
  if (typeof summary.status !== "string" || !["safe", "warning", "critical"].includes(summary.status)) {
    throw new Error("Invalid response: summary.status must be 'safe', 'warning', or 'critical'");
  }
  if (typeof summary.errorsCount !== "number") {
    summary.errorsCount = 0;
  }
  if (typeof summary.warningsCount !== "number") {
    summary.warningsCount = 0;
  }
  if (typeof summary.logicIssuesCount !== "number") {
    summary.logicIssuesCount = 0;
  }
  if (typeof summary.securityIssuesCount !== "number") {
    summary.securityIssuesCount = 0;
  }

  // Validate all array fields
  const arrayFields = [
    "syntaxErrors",
    "logicErrors", 
    "securityIssues",
    "edgeCases",
    "asyncIssues",
    "suggestions"
  ];
  
  for (const field of arrayFields) {
    validateArrayField(parsed, field);
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
