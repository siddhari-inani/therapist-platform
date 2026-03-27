# AI Assistant Chat Feature

## Overview
The AI Assistant is a conversational chat widget that helps users navigate and use the Therapist Connect platform. It can perform all website functions through natural language conversation.

## Features

### 🤖 What the AI Assistant Can Do:

1. **Search for Therapists**
   - "Find orthopedic therapists near me"
   - "Show me therapists in San Francisco"
   - "Search for pediatric therapists"

2. **Navigate the Website**
   - "Go to search page"
   - "Take me home"
   - "Show me Dr. Sarah Johnson's profile"

3. **Get Location Information**
   - "Where am I?"
   - "Get my location"

4. **Book Appointments**
   - "Book appointment with Dr. Sarah Johnson"
   - "Schedule with Dr. Michael Chen"

5. **Get Information**
   - "Tell me about Dr. Sarah Johnson"
   - "What specialties does Dr. Emily Rodriguez have?"

6. **General Help**
   - "What can you do?"
   - "How do I search for therapists?"

## How to Use

1. **Open the Chat**: Click the blue chat button (💬) in the bottom-right corner of any page
2. **Ask Questions**: Type your question or request in natural language
3. **Get Help**: The AI will respond and can perform actions like searching or navigating

## Technical Details

### Files Included:
- `ai-assistant.js` - Main AI assistant logic and chat widget
- `style.css` - Chat widget styles (already integrated)

### Integration:
The AI assistant is automatically loaded on all pages:
- `index.html`
- `search.html`
- `therapist-profile.html`

### Customization:

#### Change Chat Button Appearance:
Edit the `.ai-chat-button` styles in `style.css` or modify the inline styles in `ai-assistant.js`

#### Change AI Behavior:
Edit the `processMessage()` method in `ai-assistant.js` to add new capabilities or modify responses

#### Add Custom Actions:
Extend the `handleSearch()`, `handleNavigation()`, etc. methods in `ai-assistant.js`

## Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Chat Button Not Visible:
1. Check browser console for errors (F12 → Console)
2. Ensure you're viewing via `http://localhost:8000/` not `file://`
3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
4. Check that `ai-assistant.js` is loaded (Network tab in DevTools)

### AI Not Responding:
1. Check browser console for JavaScript errors
2. Verify `ai-assistant.js` is in the same directory as your HTML files
3. Ensure JavaScript is enabled in your browser

## Future Enhancements
- Integration with backend API for real therapist data
- Voice input support
- Multi-language support
- Advanced natural language processing
- Conversation history persistence
