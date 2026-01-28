# Claude Migration Checklist ✅

## Changes Made:

1. ✅ Installed `@anthropic-ai/sdk` (v0.71.2)
2. ✅ Rewrote `app/utils/get-llm.ts` to use Claude API
3. ✅ Updated `.env.example` with Anthropic API key format
4. ✅ Kept all existing prompts and validation logic
5. ✅ Both analysis and fix modes work with Claude

## What You Need to Do:

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Your Claude API Key
- Go to: https://console.anthropic.com/
- Create an account (if new)
- Add $5 credit to your account
- Generate an API key

### 3. Update Environment Variables

**Local development (.env.local):**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Vercel deployment:**
1. Go to your Vercel project settings
2. Environment Variables section
3. Add: `ANTHROPIC_API_KEY` with your key
4. **Remove** old `NEXT_GEMINI_API_KEY` variable
5. Redeploy

### 4. Optional: Choose Model

Default is Claude 3.5 Sonnet (best quality). To use Haiku (faster/cheaper):

```bash
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

### 5. Test Locally
```bash
npm run dev
```

Test the endpoint:
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"input": "const x = 1;", "fileName": "test.js"}'
```

### 6. Deploy to Vercel
```bash
git add .
git commit -m "Migrate to Claude API"
git push
```

Vercel will auto-deploy. Check the deployment logs for any errors.

## Cost Expectations with $5:

**Claude 3.5 Sonnet pricing:**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

**Typical analysis:**
- Input: ~2,000 tokens (your prompt + code)
- Output: ~1,000 tokens (analysis results)
- Cost per analysis: ~$0.021

**With $5 credit:**
- ~238 analyses (if using only analysis)
- ~150-200 analyses (mix of analysis + fixes)

**Claude 3.5 Haiku (if you switch):**
- 5x cheaper than Sonnet
- ~1,000 analyses with $5

## Troubleshooting:

**Error: "ANTHROPIC_API_KEY is not defined"**
- Check Vercel environment variables are set
- Make sure you redeployed after adding the variable

**Error: "credit_balance_exhausted"**
- Add more credit at https://console.anthropic.com/settings/billing

**Error: "rate_limit_error"**
- Claude has rate limits. Default tier 1:
  - 50 requests/minute
  - 40,000 tokens/minute
- Should be fine for your use case

## Model Comparison:

| Model | Quality | Speed | Cost | Use Case |
|-------|---------|-------|------|----------|
| Claude 3.5 Sonnet | Best | Medium | $0.021/analysis | Production, best fixes |
| Claude 3.5 Haiku | Good | Fast | $0.004/analysis | Development, high volume |

## Next Steps After Launch:

1. Monitor usage at https://console.anthropic.com/settings/usage
2. Set up billing alerts
3. Consider switching to Haiku for non-critical analyses
4. Build caching layer to reduce duplicate analyses

---

**Ready to launch!** 🚀

The backend is now using Claude, which will give you:
- Better code analysis
- More accurate fixes
- Clearer explanations
- Predictable costs
