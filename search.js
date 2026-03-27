// Sample therapist data (in production, this would come from an API)
const therapists = [
    {
        id: 1,
        name: 'Dr. Sarah Johnson, DPT',
        specialty: 'Orthopedic, Sports Medicine',
        location: 'San Francisco, CA 94102',
        distance: 2.3,
        rating: 4.9,
        reviews: 127,
        lat: 37.7749,
        lng: -122.4194,
        image: 'https://via.placeholder.com/150',
        description: 'Specializing in orthopedic and sports rehabilitation with over 10 years of experience.'
    },
    {
        id: 2,
        name: 'Dr. Michael Chen, PT',
        specialty: 'Pediatric, Neurological',
        location: 'Oakland, CA 94601',
        distance: 5.1,
        rating: 4.8,
        reviews: 89,
        lat: 37.8044,
        lng: -122.2712,
        image: 'https://via.placeholder.com/150',
        description: 'Expert in pediatric and neurological physical therapy with a focus on developmental care.'
    },
    {
        id: 3,
        name: 'Dr. Emily Rodriguez, DPT',
        specialty: 'Geriatric, Balance',
        location: 'Berkeley, CA 94704',
        distance: 7.2,
        rating: 4.7,
        reviews: 156,
        lat: 37.8715,
        lng: -122.2730,
        image: 'https://via.placeholder.com/150',
        description: 'Specialized in geriatric care and fall prevention with extensive experience in balance therapy.'
    },
    {
        id: 4,
        name: 'Dr. James Wilson, PT',
        specialty: 'Sports Medicine, Performance',
        location: 'San Francisco, CA 94110',
        distance: 3.5,
        rating: 4.9,
        reviews: 203,
        lat: 37.7599,
        lng: -122.4148,
        image: 'https://via.placeholder.com/150',
        description: 'Sports performance specialist working with athletes of all levels.'
    },
    {
        id: 5,
        name: 'Dr. Lisa Anderson, DPT',
        specialty: 'Women\'s Health, Pelvic',
        location: 'San Francisco, CA 94117',
        distance: 4.8,
        rating: 4.8,
        reviews: 94,
        lat: 37.7699,
        lng: -122.4469,
        image: 'https://via.placeholder.com/150',
        description: 'Certified in women\'s health and pelvic floor physical therapy.'
    }
];

// Display search results
function displayResults(results) {
    const resultsList = document.getElementById('resultsList');
    if (!resultsList) return;

    if (results.length === 0) {
        resultsList.innerHTML = '<p>No therapists found matching your criteria. Try adjusting your search.</p>';
        // Clear map if no results
        if (typeof updateMapWithResults === 'function') {
            updateMapWithResults([]);
        }
        return;
    }

    resultsList.innerHTML = results.map(therapist => `
        <div class="therapist-card" onclick="window.location.href='therapist-profile.html?id=${therapist.id}'">
            <div class="therapist-card-header">
                <div class="therapist-card-info">
                    <h3>${therapist.name}</h3>
                    <p>${therapist.specialty}</p>
                </div>
                <div class="therapist-card-rating">
                    <span class="stars">${'⭐'.repeat(Math.floor(therapist.rating))}</span>
                    <span>${therapist.rating} (${therapist.reviews} reviews)</span>
                </div>
            </div>
            <p style="color: #6b7280; margin: 0.5rem 0;">${therapist.description}</p>
            <div class="therapist-card-details">
                <span>📍 ${therapist.location}</span>
                <span>📏 ${therapist.distance} miles away</span>
            </div>
        </div>
    `).join('');

    // Update map with results
    if (typeof updateMapWithResults === 'function') {
        updateMapWithResults(results);
    } else if (window.updateMapWithResults) {
        window.updateMapWithResults(results);
    }
}

// Filter therapists based on search criteria
function filterTherapists(specialty, location) {
    let filtered = [...therapists];

    // Filter by specialty
    if (specialty) {
        const specialtyLower = specialty.toLowerCase();
        filtered = filtered.filter(t => 
            t.specialty.toLowerCase().includes(specialtyLower) ||
            t.name.toLowerCase().includes(specialtyLower)
        );
    }

    // Filter by location (simplified - in production would use geocoding)
    if (location) {
        const locationLower = location.toLowerCase();
        filtered = filtered.filter(t => 
            t.location.toLowerCase().includes(locationLower)
        );
    }

    // Sort by distance (if user location is available)
    if (window.userLocation) {
        filtered.forEach(therapist => {
            therapist.distance = calculateDistance(
                window.userLocation.latitude,
                window.userLocation.longitude,
                therapist.lat,
                therapist.lng
            );
        });
        filtered.sort((a, b) => a.distance - b.distance);
    } else {
        filtered.sort((a, b) => a.rating - b.rating).reverse();
    }

    return filtered;
}

// Initialize search page
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const specialty = urlParams.get('specialty') || '';
    const location = urlParams.get('location') || '';

    // Get user location if available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                window.userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                performSearch();
            },
            () => {
                performSearch();
            }
        );
    } else {
        performSearch();
    }

    function performSearch() {
        const results = filterTherapists(specialty, location);
        displayResults(results);
    }

    // Location button handler
    const useLocationBtn = document.getElementById('useLocation');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        window.userLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                        // Reverse geocode to fill location input
                        reverseGeocode(position.coords.latitude, position.coords.longitude);
                        // Re-run search
                        const specialtyInput = document.getElementById('specialty');
                        const locationInput = document.getElementById('location');
                        const results = filterTherapists(
                            specialtyInput?.value || '',
                            locationInput?.value || ''
                        );
                        displayResults(results);
                    },
                    (error) => {
                        alert('Unable to get your location. Please enter it manually.');
                    }
                );
            }
        });
    }
});

// Reverse geocoding helper
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'TherapistConnect/1.0'
                }
            }
        );
        
        const data = await response.json();
        
        if (data && data.address) {
            const address = data.address;
            let locationString = '';
            
            if (address.postcode) {
                locationString = address.postcode;
            } else if (address.city || address.town || address.village) {
                locationString = address.city || address.town || address.village;
            }
            
            const locationInput = document.getElementById('location');
            if (locationInput && locationString) {
                locationInput.value = locationString;
            }
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
    }
}

// Calculate distance helper (same as in script.js)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}
