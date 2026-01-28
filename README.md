# EcoSpace Code Analysis API

AI-powered code analysis and security scanning API for the EcoSpace VS Code extension.

## Features

- **Deep Code Analysis** - Detects syntax errors, logic bugs, security vulnerabilities, and edge cases
- **Language-Aware** - Optimized analysis for JavaScript, TypeScript, React, Python, Java, Go, Rust, C/C++
- **Security Focused** - Identifies injection attacks, XSS, hardcoded secrets, and more
- **Token-Based Auth** - Secure HMAC-signed tokens with tier-based access
- **Rate Limited** - Protection against abuse with per-IP rate limiting

## API Endpoints

### `POST /api/analyze`
Analyzes code for bugs, security issues, and improvements.

**Request:**
```json
{
  "input": "const x = 1;\nif (x = 2) { console.log('bug'); }",
  "fileName": "example.js"
}
```

**Response:**
```json
{
  "result": {
    "summary": {
      "errorsCount": 1,
      "warningsCount": 0,
      "logicIssuesCount": 1,
      "securityIssuesCount": 0,
      "status": "warning"
    },
    "syntaxErrors": [],
    "logicErrors": [
      {
        "id": 1,
        "title": "Assignment in condition",
        "line": 2,
        "code": "if (x = 2)",
        "whatGoesWrong": "Uses assignment (=) instead of comparison (===)",
        "triggerCondition": "Always true, always executes",
        "fix": "if (x === 2)",
        "confidence": "high",
        "reasoning": "Clear logic error"
      }
    ],
    "securityIssues": [],
    "edgeCases": [],
    "asyncIssues": [],
    "suggestions": []
  }
}
```

**Rate Limit:** 20 requests/minute per IP

---

### `POST /api/validate-token`
Validates authentication tokens.

**Request:**
```json
{
  "token": "AFKMATE-premium-abc123-user123-sig123"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Token validated successfully",
  "tier": "premium",
  "expiresAt": "2027-01-20T00:00:00.000Z"
}
```

**Rate Limit:** 10 requests/minute per IP

---

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T12:00:00.000Z",
  "version": "0.1.0"
}
```

## Setup

### Prerequisites
- Node.js 20+
- Anthropic API key from [Anthropic Console](https://console.anthropic.com/)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ecospace-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
- `ANTHROPIC_API_KEY` - Your Claude API key
- `AFKMATE_TOKEN_SECRET` - Secret for token signing (generate with `openssl rand -hex 32`)
- `CLAUDE_MODEL` - (Optional) Model to use: `claude-3-5-sonnet-20241022` (default) or `claude-3-5-haiku-20241022`

**Optional (Recommended for Production):**
- `UPSTASH_REDIS_REST_URL` - Your Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Your Upstash Redis REST token

> **Note:** Without Redis, the app uses in-memory rate limiting (suitable for development only).

### Development

```bash
npm run dev
```

API will be available at `http://localhost:3000/api/`

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `ANTHROPIC_API_KEY`
- `AFKMATE_TOKEN_SECRET`
- `CLAUDE_MODEL` (optional, defaults to claude-3-5-sonnet-20241022)
- `UPSTASH_REDIS_REST_URL` (recommended)
- `UPSTASH_REDIS_REST_TOKEN` (recommended)
- `NODE_ENV=production`

### Production Rate Limiting (Recommended)
Redis-based (Upstash) or in-memory fallback
For production deployments, use Redis-based rate limiting:

1. **Create Upstash Redis Database:**
   - Go to [console.upstash.com/redis](https://console.upstash.com/redis)
   - Click "Create Database"
   - Choose region closest to your Vercel deployment
   - Copy the **REST URL** and **REST TOKEN**

2. **Configure Environment Variables:**
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

3. **Benefits:**
   - Distributed rate limiting across all serverless instances
   - Persistent across cold starts
   - Analytics and monitoring built-in
   - Handles high traffic reliably

Without Redis, the app falls back to in-memory rate limiting (resets on cold starts).

## Security

- **CORS** - Configured origins in `middleware.ts`
- **Rate Limiting** - In-memory (Note: For production scale, use Redis/Upstash)
- **Input Validation** - Max 500KB code input, filename sanitization
- **Token Security** - HMAC-SHA256 signatures, constant-time comparison
- **Security Headers** - X-Frame-Options, X-Content-Type-Options, CSP

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Claude API key for LLM |
| `AFKMATE_TOKEN_SECRET` | Yes (prod) | - | Secret for HMAC token signing |
| `CLAUDE_MODEL` | No | `claude-3-5-sonnet-20241022` | Claude model: sonnet (best) or haiku (cheaper) |
| `UPSTASH_REDIS_REST_URL` | No | - | Upstash Redis URL for distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | - | Upstash Redis token |
| `NODE_ENV` | No | `development` | Environment mode |

### CORS Origins

Edit `middleware.ts` to add allowed origins:

```typescript
const ALLOWED_ORIGINS = [
    "https://your-domain.com",
    // ...
];
```

## Architecture

```
app/
├── api/
│   ├── analyze/         # Code analysis endpoint
│   ├── validate-token/  # Token validation
│   └── health/          # Health check
├── utils/
│   ├── prompt.ts        # LLM prompt builder
│   ├── get-llm.ts       # LLM client
│   ├── rate-limit.ts    # Rate limiting
│   ├── validation.ts    # Input validation
│   └── token.ts         # Token generation/parsing
└── middleware.ts        # CORS & routing
```

## L implement distributed rate limiting

### Token Generation
`generateToken()` utility is available in `app/utils/token.ts` for internal use. Not exposed via API endpoint.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
