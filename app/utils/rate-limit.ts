/**
 * Simple in-memory rate limiter for serverless environments
 *
 * ⚠️ PRODUCTION WARNING:
 * This in-memory implementation resets on serverless cold starts and doesn't
 * work across multiple instances. For production at scale, use a distributed
 * rate limiter with Redis:
 * 
 * Recommended: @upstash/ratelimit (https://github.com/upstash/ratelimit)
 * 
 * This implementation is suitable for:
 * - Development and testing
 * - Small to moderate traffic
 * - Single-region deployments with infrequent cold starts
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (resets on cold start, but that's acceptable for rate limiting)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Clean every minute

export interface RateLimitConfig {
    /** Max requests per window */
    limit: number;
    /** Window size in seconds */
    windowSec: number;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    resetIn: number; // seconds until reset
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = { limit: 20, windowSec: 60 }
): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowSec * 1000;
    const key = `rate:${identifier}`;

    let entry = rateLimitStore.get(key);

    // Create new entry if doesn't exist or window expired
    if (!entry || now > entry.resetTime) {
        entry = {
            count: 0,
            resetTime: now + windowMs
        };
        rateLimitStore.set(key, entry);
    }

    // Increment count
    entry.count++;

    const remaining = Math.max(0, config.limit - entry.count);
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);

    return {
        success: entry.count <= config.limit,
        limit: config.limit,
        remaining,
        resetIn
    };
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For (Vercel), X-Real-IP, or falls back to a default
 */
export function getClientIdentifier(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        // X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback - in serverless this might be the same for all requests
    // but it's better than nothing
    return 'unknown-client';
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
    // Analysis endpoint: 20 requests per minute per IP
    analyze: { limit: 20, windowSec: 60 },

    // Token validation: 10 requests per minute per IP (prevent brute force)
    validateToken: { limit: 10, windowSec: 60 },

    // Fix generation: 30 requests per minute per IP
    fix: { limit: 30, windowSec: 60 }
} as const;
