import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "../../utils/rate-limit";
import { validateTokenFormat } from "../../utils/validation";

// Token secret MUST be set in production
const TOKEN_SECRET = process.env.AFKMATE_TOKEN_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

// Fail fast if secret not configured in production
if (IS_PRODUCTION && !TOKEN_SECRET) {
    console.error("FATAL: AFKMATE_TOKEN_SECRET environment variable is not set!");
    console.error("Token validation will reject all requests until this is configured.");
}

// Use a fallback only in development
const EFFECTIVE_SECRET = TOKEN_SECRET || (IS_PRODUCTION ? "" : "dev-only-secret-do-not-use-in-prod");

interface TokenPayload {
    userId: string;
    tier: "premium" | "pro" | "enterprise";
    issuedAt: number;
    expiresAt: number;
}

/**
 * Validate token format: AFKMATE-{tier}-{timestamp}-{userId}-{signature}
 */
function parseToken(token: string): { valid: boolean; payload?: TokenPayload; message?: string } {
    if (!token || typeof token !== "string") {
        return { valid: false, message: "Token is required" };
    }

    const parts = token.split("-");

    // Expected format: AFKMATE-{tier}-{timestamp}-{userId}-{signature}
    if (parts.length !== 5 || parts[0] !== "AFKMATE") {
        return { valid: false, message: "Invalid token format" };
    }

    const [, tier, timestampStr, userId, providedSignature] = parts;

    // Validate tier
    const validTiers = ["premium", "pro", "enterprise"];
    if (!validTiers.includes(tier.toLowerCase())) {
        return { valid: false, message: "Invalid subscription tier" };
    }

    // Validate timestamp
    const timestamp = parseInt(timestampStr, 36);
    if (isNaN(timestamp)) {
        return { valid: false, message: "Invalid token timestamp" };
    }

    // Check if token has expired (tokens valid for 1 year)
    const expiresAt = timestamp + (365 * 24 * 60 * 60 * 1000);
    if (Date.now() > expiresAt) {
        return { valid: false, message: "Token has expired" };
    }

    // Verify signature using constant-time comparison to prevent timing attacks
    const dataToSign = `AFKMATE-${tier}-${timestampStr}-${userId}`;
    const expectedSignature = crypto
        .createHmac("sha256", EFFECTIVE_SECRET)
        .update(dataToSign)
        .digest("hex")
        .substring(0, 12);

    // Use constant-time comparison to prevent timing attacks
    const providedBuffer = Buffer.from(providedSignature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    
    // Signatures must be same length and match
    if (providedBuffer.length !== expectedBuffer.length || 
        !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
        return { valid: false, message: "Invalid token signature" };
    }

    return {
        valid: true,
        payload: {
            userId,
            tier: tier.toLowerCase() as TokenPayload["tier"],
            issuedAt: timestamp,
            expiresAt
        }
    };
}

/**
 * Generate a valid premium token (for internal/admin use)
 */
export function generateToken(userId: string, tier: "premium" | "pro" | "enterprise" = "premium"): string {
    if (!EFFECTIVE_SECRET) {
        throw new Error("Cannot generate tokens: AFKMATE_TOKEN_SECRET not configured");
    }

    const timestamp = Date.now();
    const timestampStr = timestamp.toString(36);
    const dataToSign = `AFKMATE-${tier}-${timestampStr}-${userId}`;
    const signature = crypto
        .createHmac("sha256", EFFECTIVE_SECRET)
        .update(dataToSign)
        .digest("hex")
        .substring(0, 12);

    return `AFKMATE-${tier}-${timestampStr}-${userId}-${signature}`;
}

export async function POST(req: NextRequest) {
    // Rate limiting to prevent brute force attacks
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId, RATE_LIMITS.validateToken);

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
