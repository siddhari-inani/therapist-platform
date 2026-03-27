# Quick Setup: Enable AI Assistant

The AI assistant is currently using a limited fallback system. To enable full AI capabilities with conversation context, follow these steps:

## Step 1: Get OpenAI API Key (Free Trial Available)

1. Go to [OpenAI Platform](https://platform.openai.com/signup)
2. Sign up for an account (free trial includes $5 credit)
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

## Step 2: Add API Key to Your Project

1. Create or edit `.env.local` in your project root:
   ```bash
   # If file doesn't exist, create it
   touch .env.local
   ```

2. Add your API key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. **Important:** Make sure `.env.local` is in your `.gitignore` file (it should be by default)

## Step 3: Restart Your Development Server

```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev
# or
yarn dev
```

## Step 4: Test It

1. Open the AI assistant (Clara) in your dashboard
2. Ask a physical therapy question
3. You should now get intelligent, context-aware responses!

## Cost Information

- **Free Trial:** $5 credit (enough for thousands of questions)
- **After Trial:** ~$0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Typical Cost:** ~$0.01-0.05 per conversation
- **Model Used:** gpt-4o-mini (cost-effective, high quality)

## Troubleshooting

### Still seeing "No OpenAI API key found"?
- Make sure `.env.local` is in the project root (same level as `package.json`)
- Restart your dev server after adding the key
- Check that the key starts with `sk-`
- No quotes needed around the key value

### Want to use a different model?
Edit `app/api/chat/route.ts` and change:
```typescript
model: "gpt-4o-mini", // Change to "gpt-4" or "gpt-3.5-turbo"
```

### Need help?
Check the full setup guide in `AI_SETUP.md`
