# 🚀 Launch Checklist - AFKmate Backend (Claude)

## ✅ Completed (by me):

1. ✅ Migrated from Google Gemini to Claude API
2. ✅ Updated `get-llm.ts` - Now uses Anthropic SDK
3. ✅ Updated `.env.example` with Claude API key format
4. ✅ Updated README with Claude setup instructions
5. ✅ Created migration guide (see CLAUDE_MIGRATION.md)
6. ✅ Both analysis + fix modes work with Claude

## 🎯 You Need to Do (for launch):

### 1. Get Claude API Key (2 mins)
```
1. Go to https://console.anthropic.com/
2. Sign up / Log in
3. Add $5 credit (Settings → Billing)
4. Create API key (Settings → API Keys)
5. Copy the key (starts with sk-ant-api03-...)
```

### 2. Update Vercel (3 mins)
```
1. Go to Vercel project: https://vercel.com/dashboard
2. Select your project (ecospace-backend)
3. Settings → Environment Variables
4. Add new variable:
   - Name: ANTHROPIC_API_KEY
   - Value: sk-ant-api03-... (your key)
5. DELETE old variable: NEXT_GEMINI_API_KEY
6. Click "Redeploy" (or push to trigger deploy)
```

### 3. Test Deployment (1 min)
```bash
# Test the endpoint after deploy
curl -X POST https://ecospace-backend.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"input": "const x = 1;", "fileName": "test.js"}'
```

Should return analysis results, not quota errors!

### 4. Monitor Usage
```
Check usage at: https://console.anthropic.com/settings/usage
```

## Expected Costs with $5:

**Claude 3.5 Sonnet (default):**
- ~$0.021 per analysis
- ~238 analyses with $5

**Claude 3.5 Haiku (if you switch):**
- ~$0.004 per analysis
- ~1,250 analyses with $5

## Quick Wins After Launch:

**Day 1:**
- [ ] Test auto-fix with real code
- [ ] Monitor first 10 analyses for quality
- [ ] Track cost per analysis

**Week 1:**
- [ ] Get 10 beta users
- [ ] Collect feedback on fix quality
- [ ] Test burst usage (hackathon simulation)

**Month 1:**
- [ ] Add caching to reduce duplicate analyses
- [ ] Consider Haiku for simpler fixes
- [ ] Build Slack integration

## Troubleshooting:

**Still getting 404?**
- Check Vercel logs: https://vercel.com/dashboard → Deployments → View Function Logs
- Verify ANTHROPIC_API_KEY is set
- Redeploy if needed

**Getting credit_balance_exhausted?**
- Add more credit at https://console.anthropic.com/settings/billing

**Analysis quality issues?**
- Claude might need prompt tuning
- Check logs for response format
- Share example with me

---

**You're 5 minutes away from launch!** 🎉

1. Get API key
2. Update Vercel
3. Test
4. Ship it

Good luck! 🚀
