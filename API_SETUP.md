# Google Maps API Setup Guide

## Getting Your API Key

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project** (or select existing)
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter a project name (e.g., "Therapist Connect")
   - Click "Create"

3. **Enable Google Maps JavaScript API**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click on it and press "Enable"

4. **Enable Additional APIs** (Optional but recommended)
   - **Places API** - For location autocomplete and place details
   - **Geocoding API** - For address to coordinates conversion
   - **Geolocation API** - For getting user's current location

5. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

6. **Restrict Your API Key** (Important for security)
   - Click on your newly created API key
   - Under "Application restrictions", select "HTTP referrers (web sites)"
   - Add your website domains:
     - `localhost:*` (for development)
     - `yourdomain.com/*` (for production)
   - Under "API restrictions", select "Restrict key"
   - Choose:
     - Maps JavaScript API
     - Places API (if enabled)
     - Geocoding API (if enabled)
   - Click "Save"

## Adding Your API Key to the Project

1. **Open `search.html`**
   - Find the line: `<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places,geometry&callback=initMap" async defer></script>`
   - Replace `YOUR_API_KEY` with your actual API key

2. **Open `therapist-profile.html`**
   - Find the line: `<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initTherapistMap" async defer></script>`
   - Replace `YOUR_API_KEY` with your actual API key

## Example

**Before:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places,geometry&callback=initMap" async defer></script>
```

**After:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&libraries=places,geometry&callback=initMap" async defer></script>
```

## Billing Information

- Google Maps Platform offers a **free tier** with $200 in free credits per month
- This typically covers:
  - 28,000 map loads per month
  - 40,000 geocoding requests per month
  - 40,000 places requests per month

For most small to medium websites, the free tier is sufficient. Monitor your usage in the Google Cloud Console.

## Testing

1. Open `search.html` in your browser
2. You should see an interactive map with therapist markers
3. If you see an error, check:
   - API key is correctly inserted
   - Required APIs are enabled
   - API key restrictions allow your domain

## Troubleshooting

**Error: "This page can't load Google Maps correctly"**
- Check that your API key is correct
- Verify Maps JavaScript API is enabled
- Check API key restrictions allow your domain

**Error: "RefererNotAllowedMapError"**
- Add your domain to the HTTP referrer restrictions in Google Cloud Console

**Map not showing**
- Check browser console for errors
- Verify API key has proper permissions
- Ensure you're using HTTPS in production (or localhost for development)

## Security Best Practices

1. **Always restrict your API key** to specific domains
2. **Never commit your API key** to public repositories
3. **Use environment variables** in production
4. **Monitor usage** regularly in Google Cloud Console
5. **Set up billing alerts** to avoid unexpected charges

## Alternative: Using Environment Variables (Advanced)

For production, consider loading the API key from an environment variable or configuration file that's not committed to version control.
