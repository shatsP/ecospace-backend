import { NextRequest, NextResponse } from "next/server";
import { getLLMFallbackResponse } from "../../utils/get-llm";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "../../utils/rate-limit";
import { validateAnalysisInput } from "../../utils/validation";

export async function POST(req: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(req);
  const rateLimit = checkRateLimit(clientId, RATE_LIMITS.analyze);

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter: rateLimit.resetIn
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetIn),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimit.resetIn)
        }
      }
    );
  }

  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate and sanitize input
    const validation = validateAnalysisInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { input, fileName } = validation.sanitized!;

    // Call LLM
    const result = await getLLMFallbackResponse(fileName, input);

    // Return with rate limit headers
    return NextResponse.json(
      { result },
      {
        headers: {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetIn)
        }
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("LLM API Error:", message, err);

    if (message.includes("Invalid response") || message.includes("JSON")) {
      return NextResponse.json(
        { error: "Failed to parse LLM response", details: message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Server error", details: message },
      { status: 500 }
    );
  }
}
