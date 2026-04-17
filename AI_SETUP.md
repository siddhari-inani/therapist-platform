# AI Assistant Setup Guide

The AI assistant (Clara) uses **Google Gemini** for physical therapy answers, voice note structuring, and audio transcription. It can also use a built-in fallback knowledge base when no API key is set.

## Features

- **Physical Therapy Expertise**: Answers questions about conditions, treatments, rehabilitation protocols, and evidence-based practice
- **Practice Management**: Helps navigate the platform, manage patients, and schedule appointments
- **Voice Note Assistant**: Structure voice transcripts into SOAP notes and transcribe uploaded audio (Charting page)
- **Smart Detection**: Automatically detects physical therapy questions and routes them to the AI

## Setup

### Option 1: Using Google Gemini API (Recommended)

1. **Get a Gemini API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/apikey)
   - Sign in with your Google account
   - Create a new API key (free tier available)

2. **Add API Key to Environment Variables**
   - Create or update `.env.local` in the project root
   - Add your API key:
     ```
     GEMINI_API_KEY=your-gemini-api-key-here
     ```
   - For Vercel deployments, add the same value in project env vars (`Production` + `Preview`):
     ```bash
     echo "your-gemini-api-key-here" | vercel env add GEMINI_API_KEY production preview
     ```
   - If you already use Google SDK naming, `GOOGLE_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY` are also supported.

3. **Restart Your Development Server**
   - The app will use Gemini for AI chat, voice “Structure as SOAP”, and audio transcription

### Option 2: Using Fallback Knowledge Base (Chat Only)

If you don't set `GEMINI_API_KEY`, the **AI chat** will use a built-in knowledge base that covers:
- Common conditions (rotator cuff, ACL, low back pain, etc.)
- Treatment approaches
- Exercise principles
- General physical therapy guidance

The fallback works immediately without any setup. **Voice note assistant** (Structure as SOAP, Upload audio) still requires `GEMINI_API_KEY`.

## Usage

### Asking Physical Therapy Questions

You can ask Clara questions like:

- "What's the best approach for rotator cuff rehabilitation?"
- "How do I treat low back pain?"
- "Explain ACL recovery protocol"
- "What exercises help with knee pain?"
- "Tell me about post-surgical rehabilitation"
- "What's the evidence for manual therapy?"
- "How long does it take to recover from a meniscus tear?"

### Practice Management

Clara can also help with:
- "Show me my patients"
- "What appointments do I have today?"
- "Go to calendar"
- "Create SOAP note"
- "Show dashboard stats"

### Voice Note Assistant (Charting)

On the Charting page, the voice note assistant uses Gemini for:
- **Structure as SOAP**: Turn a transcript into S/O/A/P sections
- **Upload audio**: Transcribe an audio file to text (Gemini multimodal)

## AI Capabilities

The AI assistant is trained on:

- **Orthopedic Rehabilitation**: Joint injuries, fractures, post-surgical recovery
- **Sports Medicine**: Athletic performance, injury prevention
- **Neurological Rehabilitation**: Stroke, spinal cord injuries, Parkinson's
- **Pediatric & Geriatric Care**: Age-specific interventions
- **Pain Management**: Chronic conditions, pain science
- **Manual Therapy**: Techniques and applications
- **Therapeutic Exercise**: Prescription and progression
- **Evidence-Based Practice**: Current research and guidelines

## Important Notes

⚠️ **Disclaimer**: The AI provides educational information only. It should not replace professional medical advice or clinical judgment. Always:
- Consult with licensed physical therapists for specific treatment
- Use clinical judgment in all cases
- Follow evidence-based practice guidelines
- Respect patient autonomy and informed consent

## Troubleshooting

### Quota or API key errors (Gemini)
- **Cause:** Invalid or missing API key, or Gemini quota/limits exceeded.
- **Fix:** Go to [Google AI Studio – API Keys](https://aistudio.google.com/apikey) and:
  - Create or regenerate an API key
  - Check usage and limits for your project
- **In the app:** Voice note assistant and AI chat will show a clear message and link when this happens.

### AI Not Responding
- Check that your `.env.local` file has the correct `GEMINI_API_KEY`
- Verify the API key is valid at [Google AI Studio](https://aistudio.google.com/apikey)
- Check the browser console for errors
- The fallback knowledge base works for chat even without an API key

### Responses Not Relevant
- Try rephrasing your question
- Be more specific about what you're asking
- The AI works best with clear, specific questions

## Cost Considerations

- **Gemini API:** Google offers a free tier; usage beyond that depends on your Google Cloud / AI Studio setup. Get your key at [Google AI Studio](https://aistudio.google.com/apikey).
- **Quota errors:** If you see quota or limit errors, check your key and usage in AI Studio.
- **Fallback:** AI chat can use a built-in knowledge base when `GEMINI_API_KEY` is missing or quota is exceeded (chat only; voice features require a valid key).
- Consider monitoring usage in production.

## Future Enhancements

Potential improvements:
- Integration with patient records for personalized advice
- SOAP note generation assistance
- Treatment plan suggestions
- Exercise program recommendations
- Clinical decision support tools
