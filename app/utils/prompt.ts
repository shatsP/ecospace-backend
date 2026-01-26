export type Confidence = "high" | "medium" | "low";
export type Severity = "low" | "medium" | "high" | "critical";
export type Status = "safe" | "warning" | "critical";

export interface FixResult {
  fixedCode: string;
  explanation: string;
  confidence: Confidence;
}

export interface IssueForFix {
  line: number;
  message: string;
  type: string;
  severity: string;
}

export interface AnalysisResult {
  summary: {
    errorsCount: number;
    warningsCount: number;
    logicIssuesCount: number;
    securityIssuesCount: number;
    status: Status;
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
    severity: Severity;
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

/**
 * Detect language from file extension for targeted analysis
 */
function detectLanguage(fileName: string): {
  language: string;
  category: "js" | "python" | "java" | "go" | "rust" | "c" | "other";
  specificRules: string;
} {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  const languageMap: Record<string, { language: string; category: "js" | "python" | "java" | "go" | "rust" | "c" | "other"; specificRules: string }> = {
    // JavaScript/TypeScript ecosystem
    js: {
      language: "JavaScript",
      category: "js",
      specificRules: `
- Check for == vs === (prefer strict equality)
- Verify proper use of 'this' binding in callbacks
- Look for accidental global variables (missing let/const/var)
- Check Promise chains have error handling
- Verify async/await is used correctly (no floating promises)`
    },
    jsx: {
      language: "React JSX",
      category: "js",
      specificRules: `
- Verify useEffect dependencies array is complete
- Check for missing keys in list rendering
- Look for state updates in render causing infinite loops
- Verify cleanup functions in useEffect
- Check for stale closures in event handlers
- Ensure hooks are not called conditionally`
    },
    ts: {
      language: "TypeScript",
      category: "js",
      specificRules: `
- Check for unsafe 'any' type usage
- Verify proper null/undefined narrowing
- Look for type assertions that could fail at runtime
- Check exhaustive switch statements for union types
- Verify generic constraints are correct`
    },
    tsx: {
      language: "React TypeScript",
      category: "js",
      specificRules: `
- All React JSX rules plus TypeScript rules
- Verify component prop types are correctly defined
- Check for proper typing of event handlers
- Verify useRef generic types match usage
- Check useState initial values match type`
    },
    mjs: { language: "JavaScript ESM", category: "js", specificRules: "" },
    cjs: { language: "JavaScript CommonJS", category: "js", specificRules: "" },

    // Python
    py: {
      language: "Python",
      category: "python",
      specificRules: `
- Check for mutable default arguments (def fn(x=[]))
- Verify proper exception handling (bare except is bad)
- Look for variable shadowing in nested scopes
- Check for proper resource cleanup (use context managers)
- Verify iterator exhaustion isn't causing bugs
- Check for late binding closures in loops`
    },
    pyw: { language: "Python", category: "python", specificRules: "" },

    // Java/JVM
    java: {
      language: "Java",
      category: "java",
      specificRules: `
- Check for null pointer dereferences
- Verify proper resource cleanup (try-with-resources)
- Look for equals/hashCode contract violations
- Check for thread safety issues with shared state
- Verify proper exception handling hierarchy
- Check for potential ClassCastException`
    },
    kt: {
      language: "Kotlin",
      category: "java",
      specificRules: `
- Check for unsafe !! operator usage
- Verify proper null safety with ?. and ?:
- Look for potential platform type issues
- Check coroutine scope management`
    },
    kts: { language: "Kotlin Script", category: "java", specificRules: "" },
    scala: { language: "Scala", category: "java", specificRules: "" },

    // Go
    go: {
      language: "Go",
      category: "go",
      specificRules: `
- Check for unchecked errors (err != nil)
- Verify goroutine leaks (missing done channels)
- Look for race conditions with shared data
- Check defer order (LIFO) is correct
- Verify nil pointer dereferences
- Check for proper context cancellation`
    },

    // Rust
    rs: {
      language: "Rust",
      category: "rust",
      specificRules: `
- Check for unwrap() on Option/Result without handling
- Verify lifetime annotations are correct
- Look for potential panics in unsafe blocks
- Check for proper error propagation with ?
- Verify ownership and borrowing rules`
    },

    // C/C++
    c: {
      language: "C",
      category: "c",
      specificRules: `
- Check for buffer overflows
- Verify memory allocation/deallocation pairs
- Look for use-after-free vulnerabilities
- Check for null pointer dereferences
- Verify format string vulnerabilities
- Check for integer overflow/underflow`
    },
    cpp: { language: "C++", category: "c", specificRules: "" },
    cc: { language: "C++", category: "c", specificRules: "" },
    cxx: { language: "C++", category: "c", specificRules: "" },
    h: { language: "C/C++ Header", category: "c", specificRules: "" },
    hpp: { language: "C++ Header", category: "c", specificRules: "" },

    // Other
    cs: { language: "C#", category: "other", specificRules: "" },
    php: { language: "PHP", category: "other", specificRules: "" },
    rb: { language: "Ruby", category: "other", specificRules: "" },
    swift: { language: "Swift", category: "other", specificRules: "" },
    dart: { language: "Dart", category: "other", specificRules: "" },
    vue: { language: "Vue", category: "js", specificRules: "" },
    svelte: { language: "Svelte", category: "js", specificRules: "" },
    sql: { language: "SQL", category: "other", specificRules: `
- Check for SQL injection vulnerabilities
- Verify proper parameterized queries
- Look for missing WHERE clauses in UPDATE/DELETE` },
  };

  return languageMap[ext] || { language: "Unknown", category: "other", specificRules: "" };
}

/**
 * Compact schema definition - no empty placeholder values
 */
const SCHEMA_DEFINITION = `{
  "summary": { "errorsCount": int, "warningsCount": int, "logicIssuesCount": int, "securityIssuesCount": int, "status": "safe"|"warning"|"critical" },
  "syntaxErrors": [{ "id": int, "line": int, "code": "snippet", "fix": "corrected code", "confidence": "high"|"medium" }],
  "logicErrors": [{ "id": int, "title": "brief name", "line": int, "code": "snippet", "whatGoesWrong": "description", "triggerCondition": "when it fails", "fix": "solution", "confidence": "high"|"medium", "reasoning": "why flagged" }],
  "securityIssues": [{ "id": int, "type": "category", "severity": "low"|"medium"|"high"|"critical", "line": int, "attackVector": "how exploited", "fix": "mitigation", "confidence": "high"|"medium", "reasoning": "why flagged" }],
  "edgeCases": [{ "id": int, "line": int, "assumption": "what code assumes", "breakingInput": "input that breaks it", "fix": "defensive code", "confidence": "high"|"medium" }],
  "asyncIssues": [{ "id": int, "line": int, "issue": "description", "consequence": "what goes wrong", "fix": "solution", "confidence": "high"|"medium", "reasoning": "why flagged" }],
  "suggestions": [{ "id": int, "title": "improvement", "current": "current approach", "recommended": "better approach", "benefit": "why better", "confidence": "high"|"medium" }]
}`;

const CORE_ANALYSIS_RULES = `ANALYSIS CATEGORIES:

1. LOGIC ERRORS - Silent failures that produce wrong results
   • Boolean logic mistakes (&&/|| confusion, De Morgan errors)
   • Off-by-one in loops, array bounds, string slicing
   • Incorrect comparisons (==vs===, </<=, floating point)
   • Null/undefined access without guards
   • Type coercion bugs (0, "", false, null behaving unexpectedly)

2. ASYNC/CONCURRENCY - Timing and ordering bugs
   • Missing await causing unhandled promises
   • Race conditions in shared state
   • Callback ordering issues
   • Resource cleanup not waiting for async completion

3. EDGE CASES - Unhandled inputs
   • Empty arrays/strings/objects
   • Zero, negative, NaN, Infinity
   • Unicode, special characters, very long strings
   • Null vs undefined vs missing property

4. SECURITY - Exploitable vulnerabilities
   • Injection (SQL, NoSQL, command, XSS)
   • Hardcoded secrets or credentials
   • Insecure cryptography or randomness
   • Path traversal, SSRF, open redirects
   • Missing input validation/sanitization

5. ERROR HANDLING - Failure mode issues
   • Unhandled promise rejections
   • Empty catch blocks swallowing errors
   • Missing error propagation
   • No cleanup on failure paths

6. RESOURCE MANAGEMENT
   • Memory leaks (listeners, timers, closures)
   • Unclosed connections/handles/streams
   • Unbounded growth (caches, queues)`;

const CONFIDENCE_RULES = `CONFIDENCE LEVELS (only report medium or high):
• HIGH: You can trace the exact execution path. Reproducible with specific input.
• MEDIUM: Likely issue based on patterns, but depends on runtime context.
• Skip LOW confidence - better to miss uncertain issues than report false positives.`;

const OUTPUT_RULES = `OUTPUT RULES:
• Maximum 5 issues per category (prioritize by severity)
• Include "reasoning" for logic, security, and async issues
• Be specific: cite exact line numbers and variable names
• Provide actionable fixes, not vague suggestions
• Return empty arrays [] for categories with no issues
• summary.status: "critical" if any security high/critical, "warning" if any issues, "safe" if clean`;

export function buildPrompt(fileName?: string, code?: string): string {
  if (!fileName && !code) {
    throw new Error("At least fileName or code must be provided");
  }

  const langInfo = detectLanguage(fileName || "unknown.txt");
  
  const languageContext = langInfo.specificRules
    ? `\nLANGUAGE-SPECIFIC (${langInfo.language}):\n${langInfo.specificRules}\n`
    : "";

  const codeSection = fileName && code
    ? `\n---\nFILE: ${fileName} (${langInfo.language})\n\n\`\`\`\n${code}\n\`\`\`\n---`
    : code
      ? `\n---\nCODE:\n\`\`\`\n${code}\n\`\`\`\n---`
      : "";

  return `You are an expert static analyzer. Analyze the code for bugs, security issues, and improvements. Return ONLY valid JSON.

${CORE_ANALYSIS_RULES}
${languageContext}
${CONFIDENCE_RULES}

${OUTPUT_RULES}

ANALYSIS METHOD - For each code block, ask:
• "What inputs would break this function?"
• "What if this value is null/undefined/empty?"
• "What if this async operation fails or runs out of order?"
• "Could an attacker exploit this?"
• "What happens at boundary conditions?"

JSON SCHEMA:
${SCHEMA_DEFINITION}
${codeSection}

Analyze step-by-step. Return ONLY the JSON object, starting with { and ending with }. No markdown, no explanation.`;
}

const FIX_SCHEMA_DEFINITION = `{
  "fixedCode": "// The corrected code goes here",
  "explanation": "Explanation of what was fixed and why",
  "confidence": "high"|"medium"|"low"
}`;

/**
 * Build a prompt for fixing a specific issue in code
 */
export function buildFixPrompt(
  codeSection: string,
  issue: IssueForFix,
  fileName?: string,
  fullFileContext?: string
): string {
  const langInfo = detectLanguage(fileName || "unknown.txt");
  const fileInfo = fileName ? `File: ${fileName} (${langInfo.language})` : '';
  const contextSection = fullFileContext
    ? `\nFull file context (for reference only - fix the code section below):\n\`\`\`\n${fullFileContext.substring(0, 10000)}\n\`\`\`\n`
    : '';

  return `You are a senior software engineer fixing a specific code issue. Return ONLY valid JSON.

${fileInfo}

ISSUE TO FIX:
- Line: ${issue.line}
- Type: ${issue.type}
- Severity: ${issue.severity}
- Message: ${issue.message}
${contextSection}
CODE SECTION TO FIX:
\`\`\`
${codeSection}
\`\`\`

INSTRUCTIONS:
1. Analyze the issue and understand the root cause
2. Generate the FIXED version of the code section above
3. The fixed code should:
   - Resolve the specific issue mentioned
   - Maintain the same structure and style
   - Not introduce new issues
   - Be a drop-in replacement for the code section

CONFIDENCE SCORING:
- "high": The fix is straightforward and definitively resolves the issue
- "medium": The fix should work but depends on context outside the visible code
- "low": The fix is a best guess; more context would help

JSON SCHEMA:
${FIX_SCHEMA_DEFINITION}

Return ONLY the JSON object with the fixed code. Start with { and end with }. Nothing else.
The "fixedCode" field should contain the complete fixed version of the code section.`;
}
