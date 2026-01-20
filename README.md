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
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

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
- `NEXT_GEMINI_API_KEY` - Your Gemini API key
- `AFKMATE_TOKEN_SECRET` - Secret for token signing (generate with `openssl rand -hex 32`)

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
- `NEXT_GEMINI_API_KEY`
- `AFKMATE_TOKEN_SECRET`
- `NODE_ENV=production`

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
| `NEXT_GEMINI_API_KEY` | Yes | - | Gemini API key for LLM |
| `AFKMATE_TOKEN_SECRET` | Yes (prod) | - | Secret for HMAC token signing |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Gemini model to use |
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

## Limitations

### Rate Limiting
Current in-memory rate limiter resets on serverless cold starts. For production at scale:
- Use Redis-based solution like [@upstash/ratelimit](https://github.com/upstash/ratelimit)
- Or implement distributed rate limiting

### Token Generation
`generateToken()` utility is available in `app/utils/token.ts` for internal use. Not exposed via API endpoint.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
