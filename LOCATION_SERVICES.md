# Location Services Integration

This document describes the location services integration for therapists in the Revora Health platform.

## Features

### 1. Therapist Location Management
- Therapists can add and update their practice location
- Address fields: Address Line 1, Address Line 2, City, State, ZIP Code, Country
- Automatic geocoding to convert addresses to coordinates (latitude/longitude)
- Manual location capture using device GPS

### 2. Location Display
- Practice location displayed on therapist profile
- Interactive Google Maps integration showing practice location
- Address formatted and displayed clearly

### 3. Geocoding
- **Google Maps Geocoding API**: Converts addresses to coordinates
- **Current Location**: Uses browser geolocation API to capture current location
- Automatic coordinate storage for location-based features

## Setup

### 1. Database Migration

Run the migration to add location fields to the profiles table:

```sql
-- Migration: 20240111000000_add_location_to_profiles.sql
```

This adds the following columns to `profiles`:
- `address_line1` (TEXT)
- `address_line2` (TEXT)
- `city` (TEXT)
- `state` (TEXT)
- `zip_code` (TEXT)
- `country` (TEXT, default: 'US')
- `latitude` (DECIMAL(10, 8))
- `longitude` (DECIMAL(11, 8))

### 2. Google Maps API Key

Add your Google Maps API key to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Required APIs:**
- Maps JavaScript API
- Geocoding API

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable "Maps JavaScript API" and "Geocoding API"
4. Create an API key
5. (Optional) Restrict the API key to your domain for security
6. Add the key to your `.env.local` file

### 3. Apply Migration

Run the migration in your Supabase project:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20240111000000_add_location_to_profiles.sql`
3. Run the SQL in the editor

Or use Supabase CLI:
```bash
supabase db push
```

## Usage

### For Therapists

1. **Navigate to Profile**
   - Go to Dashboard → Profile
   - Click "Edit Profile" button

2. **Add Location**
   - Fill in address fields (Address, City, State, ZIP)
   - Click "Geocode Address" to convert address to coordinates
   - Or click "Use Current Location" to capture GPS coordinates

3. **Save Changes**
   - Click "Save Changes"
   - Location will be displayed on your profile with an interactive map

### Location Features

#### Geocode Address
- Converts a full address to latitude/longitude coordinates
- Requires Google Maps Geocoding API
- Shows success/error notifications

#### Use Current Location
- Uses browser geolocation API
- Requires user permission
- Captures current GPS coordinates
- Useful for mobile devices

#### Location Display
- Address formatted and displayed on profile
- Interactive map showing practice location
- Clickable marker with address info window

## Components

### TherapistProfileForm
Location: `components/therapist/therapist-profile-form.tsx`

A comprehensive form for editing therapist profile including:
- Basic information (name, phone, license, bio, specialties)
- Location fields (address, city, state, ZIP, country)
- Geocoding functionality
- Current location capture

### TherapistLocationMap
Location: `components/therapist/therapist-location-map.tsx`

Displays an interactive Google Map showing the therapist's practice location:
- Centered on practice coordinates
- Marker at practice location
- Info window with address
- Responsive design

## API Integration

### Google Maps Geocoding

```typescript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
);
const data = await response.json();
// Extract: data.results[0].geometry.location.lat/lng
```

### Browser Geolocation

```typescript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // Use coordinates
  },
  (error) => {
    // Handle error
  }
);
```

## Database Schema

```sql
ALTER TABLE public.profiles
  ADD COLUMN address_line1 TEXT,
  ADD COLUMN address_line2 TEXT,
  ADD COLUMN city TEXT,
  ADD COLUMN state TEXT,
  ADD COLUMN zip_code TEXT,
  ADD COLUMN country TEXT DEFAULT 'US',
  ADD COLUMN latitude DECIMAL(10, 8),
  ADD COLUMN longitude DECIMAL(11, 8);
```

## Future Enhancements

1. **Multiple Locations**: Support for therapists with multiple practice locations
2. **Location Search**: Find therapists by location/radius
3. **Distance Calculation**: Calculate distance between patient and therapist
4. **Location History**: Track location changes over time
5. **Address Autocomplete**: Google Places Autocomplete for address input
6. **Map Clustering**: Group nearby therapists on map views

## Troubleshooting

### Map Not Loading
- Check Google Maps API key is set in `.env.local`
- Verify API key has correct permissions
- Check browser console for errors
- Ensure Maps JavaScript API is enabled

### Geocoding Fails
- Verify Geocoding API is enabled
- Check API key restrictions
- Ensure address fields are filled correctly
- Check API quota limits

### Current Location Not Working
- Browser may block geolocation (check permissions)
- HTTPS required for geolocation (except localhost)
- User must grant location permission

## Security Notes

1. **API Key Security**
   - Restrict API key to your domain
   - Use environment variables (never commit keys)
   - Monitor API usage for abuse

2. **Location Privacy**
   - Location data is stored in database
   - Only therapists can edit their own location
   - Consider privacy settings for location visibility

3. **RLS Policies**
   - Location fields follow existing RLS policies
   - Therapists can only update their own profile
   - Patients can view therapist locations (if allowed by policy)

---

**Last Updated**: January 25, 2026
