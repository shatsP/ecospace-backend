export type Confidence = "high" | "medium" | "low";

export interface AnalysisResult {
  summary: {
    errorsCount: number;
    warningsCount: number;
    logicIssuesCount: number;
    securityIssuesCount: number;
    status: "safe" | "warning" | "critical";
  };
  syntaxErrors: Array<{
    id: number;
    line: number;
    code: string;
    fix: string;
    confidence: Confidence;
  }>;
  logicErrors: Array<{
    id: number;
    title: string;
    line: number;
    code: string;
    whatGoesWrong: string;
    triggerCondition: string;
    fix: string;
    confidence: Confidence;
    reasoning: string;
  }>;
  securityIssues: Array<{
    id: number;
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    line: number;
    attackVector: string;
    fix: string;
    confidence: Confidence;
    reasoning: string;
  }>;
  edgeCases: Array<{
    id: number;
    line: number;
    assumption: string;
    breakingInput: string;
    fix: string;
    confidence: Confidence;
  }>;
  asyncIssues: Array<{
    id: number;
    line: number;
    issue: string;
    consequence: string;
    fix: string;
    confidence: Confidence;
    reasoning: string;
  }>;
  suggestions: Array<{
    id: number;
    title: string;
    current: string;
    recommended: string;
    benefit: string;
    confidence: Confidence;
  }>;
}

const analysisCategories = `
ANALYSIS DEPTH - Go beyond syntax. Trace execution paths mentally:

1. LOGIC ERRORS (Silent failures)
   - Incorrect boolean logic (&&/|| confusion, negation errors)
   - Off-by-one errors in loops and array access
   - Wrong comparison operators (==/===, </<=)
   - Incorrect null/undefined checks
   - Type coercion bugs (0, "", false, null comparisons)

2. ASYNC/CONCURRENCY ISSUES
   - Missing await on promises
   - Race conditions in state updates
   - Parallel mutations of shared state
   - Callback hell leading to unpredictable order

3. EDGE CASES NOT HANDLED
   - Empty arrays/objects accessed without checks
   - Division by zero possibilities
   - Negative numbers where only positive expected
   - String operations on potentially undefined values

4. SECURITY VULNERABILITIES
   - SQL/NoSQL injection vectors
   - XSS through unsanitized output
   - Command injection in exec/spawn
   - Hardcoded credentials or API keys
   - Insecure randomness for security purposes

5. ERROR HANDLING GAPS
   - Promises without .catch() or try/catch
   - Empty catch blocks that swallow errors
   - Errors caught but not logged or re-thrown
   - Missing finally blocks for cleanup

6. MEMORY & RESOURCE LEAKS
   - Event listeners added but never removed
   - setInterval/setTimeout not cleared
   - Database connections not closed
   - Large objects held in closures unnecessarily

7. DATA INTEGRITY RISKS
   - Mutations of function parameters
   - Shared mutable state between modules
   - Missing validation before database writes
   - Inconsistent data transformations`;

const confidenceGuidelines = `
CONFIDENCE SCORING - Be honest about certainty:
- "high": You can trace exact execution path that causes the issue. Clear, reproducible.
- "medium": Issue is likely based on common patterns, but depends on runtime context you can't see.
- "low": Potential issue, but would need more context to confirm. May be a false positive.

Include "reasoning" field for logic, security, and async issues to explain WHY you flagged it.
Only report issues with medium or high confidence. Skip low-confidence issues entirely.
It's better to miss an uncertain issue than to report false positives.`;

const schemaExample: AnalysisResult = {
  summary: {
    errorsCount: 0,
    warningsCount: 0,
    logicIssuesCount: 0,
    securityIssuesCount: 0,
    status: "safe"
  },
  syntaxErrors: [{ id: 1, line: 0, code: "", fix: "", confidence: "high" }],
  logicErrors: [{
    id: 1,
    title: "",
    line: 0,
    code: "",
    whatGoesWrong: "",
    triggerCondition: "",
    fix: "",
    confidence: "high",
    reasoning: ""
  }],
  securityIssues: [{
    id: 1,
    type: "",
    severity: "low",
    line: 0,
    attackVector: "",
    fix: "",
    confidence: "high",
    reasoning: ""
  }],
  edgeCases: [{
    id: 1,
    line: 0,
    assumption: "",
    breakingInput: "",
    fix: "",
    confidence: "high"
  }],
  asyncIssues: [{
    id: 1,
    line: 0,
    issue: "",
    consequence: "",
    fix: "",
    confidence: "high",
    reasoning: ""
  }],
  suggestions: [{
    id: 1,
    title: "",
    current: "",
    recommended: "",
    benefit: "",
    confidence: "high"
  }]
};

export function buildPrompt(fileName?: string, code?: string): string {
  if (!fileName && !code) {
    throw new Error("At least fileName or code must be provided");
  }

  const codeSection = fileName && code
    ? `\nFile: ${fileName}\n\nCode:\n\`\`\`\n${code}\n\`\`\`\n`
    : code
      ? `\nCode:\n\`\`\`\n${code}\n\`\`\`\n`
      : '';

  return `You are a senior code reviewer performing deep static and logical analysis. Return ONLY valid JSON.

${analysisCategories}

${confidenceGuidelines}

ANALYSIS APPROACH:
- For each function, ask: "What inputs would break this?"
- For each condition, ask: "Is this logic correct for ALL cases?"
- For each async operation, ask: "What if this runs out of order?"
- For each data access, ask: "What if this is null/undefined/empty?"
- For each loop, ask: "Are the bounds correct? Could this infinite loop?"
- For each external call, ask: "What if this fails or returns unexpected data?"

JSON Schema (return arrays empty if no issues found):
${JSON.stringify(schemaExample, null, 2)}

${codeSection}

Think step-by-step through the code execution paths. Identify concrete failure scenarios.
Return ONLY the JSON object. Start with { and end with }. Nothing else.`;
}
