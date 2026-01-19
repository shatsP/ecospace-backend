import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * Used by the frontend to verify backend connectivity
 * Note: Does not expose configuration status for security reasons
 */
export async function GET() {
    return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "0.1.0"
    });
}

// Also support HEAD requests for simple availability checks
export async function HEAD() {
    return new NextResponse(null, { status: 200 });
}
