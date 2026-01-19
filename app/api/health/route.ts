import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * Used by the frontend to verify backend connectivity
 */
export async function GET() {
    const hasTokenSecret = !!process.env.AFKMATE_TOKEN_SECRET;
    const hasLLMKey = !!process.env.NEXT_GEMINI_API_KEY;

    return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "0.1.0",
        checks: {
            tokenValidation: hasTokenSecret ? "configured" : "not_configured",
            llmProvider: hasLLMKey ? "configured" : "not_configured"
        }
    });
}

// Also support HEAD requests for simple availability checks
export async function HEAD() {
    return new NextResponse(null, { status: 200 });
}
