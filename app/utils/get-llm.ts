import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, buildFixPrompt, AnalysisResult, FixResult, IssueForFix } from "./prompt";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Model can be configured via environment variable
// Options: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

/**
 * Extract JSON from Claude response, handling markdown code blocks
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

/**
 * Parse and validate fix response
 */
function parseAndValidateFixResponse(text: string): FixResult {
  const jsonString = extractJSON(text);
  const parsed = JSON.parse(jsonString);

  // Validate required structure
  if (!parsed.fixedCode || typeof parsed.fixedCode !== "string") {
    throw new Error("Invalid fix response: missing fixedCode");
  }

  return {
    fixedCode: parsed.fixedCode,
    explanation: parsed.explanation || "Fix applied",
    confidence: parsed.confidence || "medium"
  } as FixResult;
}

/**
 * Call Claude for code analysis
 */
export async function getLLMFallbackResponse(
  fileName: string | undefined,
  code: string
): Promise<AnalysisResult> {
  const prompt = buildPrompt(fileName, code);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
  });

  // Extract text from Claude's response
  const textContent = message.content.find(block => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Claude returned no text response");
  }

  const text = textContent.text;
  console.log("[Claude Raw Response]", text);

  return parseAndValidateResponse(text);
}

/**
 * Call Claude to generate a fix for a specific issue
 */
export async function getLLMFixResponse(
  codeSection: string,
  issue: IssueForFix,
  fileName?: string,
  fullFileContext?: string
): Promise<FixResult> {
  const prompt = buildFixPrompt(codeSection, issue, fileName, fullFileContext);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
  });

  // Extract text from Claude's response
  const textContent = message.content.find(block => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("Claude returned no text response");
  }

  const text = textContent.text;
  console.log("[Claude Fix Raw Response]", text);

  return parseAndValidateFixResponse(text);
}
