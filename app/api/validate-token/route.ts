import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "../../utils/rate-limit";
import { validateTokenFormat } from "../../utils/validation";
import { parseToken } from "../../utils/token";

// Token secret MUST be set in production
const TOKEN_SECRET = process.env.AFKMATE_TOKEN_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

export async function POST(req: NextRequest) {
    // Rate limiting to prevent brute force attacks
    const clientId = getClientIdentifier(req);
    const rateLimit = await checkRateLimit(clientId, RATE_LIMITS.validateToken);

    if (!rateLimit.success) {
        return NextResponse.json(
            { valid: false, message: "Too many validation attempts. Please try again later." },
            {
                status: 429,
                headers: { "Retry-After": String(rateLimit.resetIn) }
            }
        );
    }

    // Check if secret is configured in production
    if (IS_PRODUCTION && !TOKEN_SECRET) {
        console.error("Token validation attempted but AFKMATE_TOKEN_SECRET is not set");
        return NextResponse.json(
            { valid: false, message: "Service temporarily unavailable" },
            { status: 503 }
        );
    }

    try {
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { valid: false, message: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { token } = body;

        // Basic validation before crypto operations
        const formatCheck = validateTokenFormat(token);
        if (!formatCheck.valid) {
            return NextResponse.json(
                { valid: false, message: formatCheck.error },
                { status: 400 }
            );
        }

        const result = parseToken(token);

        if (!result.valid) {
            return NextResponse.json(
                { valid: false, message: result.message },
                { status: 401 }
            );
        }

        // Token is valid
        return NextResponse.json({
            valid: true,
            message: "Token validated successfully",
            tier: result.payload?.tier,
            expiresAt: result.payload?.expiresAt
                ? new Date(result.payload.expiresAt).toISOString()
                : undefined
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Token validation error:", message);

        return NextResponse.json(
            { valid: false, message: "Validation failed" },
            { status: 500 }
        );
    }
}

// NOTE: GET endpoint removed for security reasons
// Tokens in URLs get logged in browser history, server logs, and proxy logs
// Always use POST with token in request body
