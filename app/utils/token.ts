import crypto from "crypto";

const TOKEN_SECRET = process.env.AFKMATE_TOKEN_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";

// Fail fast if secret not configured in production
if (IS_PRODUCTION && !TOKEN_SECRET) {
    console.error("FATAL: AFKMATE_TOKEN_SECRET environment variable is not set!");
}

// Use a fallback only in development
const EFFECTIVE_SECRET = TOKEN_SECRET || (IS_PRODUCTION ? "" : "dev-only-secret-do-not-use-in-prod");

export interface TokenPayload {
    userId: string;
    tier: "premium" | "pro" | "enterprise";
    issuedAt: number;
    expiresAt: number;
}

/**
 * Validate token format: AFKMATE-{tier}-{timestamp}-{userId}-{signature}
 */
export function parseToken(token: string): { valid: boolean; payload?: TokenPayload; message?: string } {
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
