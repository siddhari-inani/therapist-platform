// Location Services
let userLocation = null;

// Get user's current location
function getCurrentLocation() {
    const statusElement = document.getElementById('locationStatus');
    
    if (!navigator.geolocation) {
        if (statusElement) {
            statusElement.textContent = 'Geolocation is not supported by your browser';
            statusElement.style.color = '#ef4444';
        }
        return;
    }

    if (statusElement) {
        statusElement.textContent = 'Getting your location...';
        statusElement.style.color = '#2563eb';
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            if (statusElement) {
                statusElement.textContent = 'Location found!';
                statusElement.style.color = '#10b981';
            }

            // Reverse geocoding to get address
            reverseGeocode(userLocation.latitude, userLocation.longitude);
        },
        (error) => {
            let errorMessage = 'Unable to retrieve your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Please allow location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Location request timed out.';
                    break;
                default:
                    errorMessage += 'An unknown error occurred.';
                    break;
            }
            
            if (statusElement) {
                statusElement.textContent = errorMessage;
                statusElement.style.color = '#ef4444';
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Reverse geocoding using Nominatim (OpenStreetMap) - Free alternative
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
            } else if (address.county) {
                locationString = address.county;
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

// Initialize location button
document.addEventListener('DOMContentLoaded', () => {
    const useLocationBtn = document.getElementById('useLocation');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            getCurrentLocation();
        });
    }

    // Get location from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const locationParam = urlParams.get('location');
    const specialtyParam = urlParams.get('specialty');
    
    if (locationParam) {
        const locationInput = document.getElementById('location');
        if (locationInput) {
            locationInput.value = locationParam;
        }
    }
    
    if (specialtyParam) {
        const specialtyInput = document.getElementById('specialty');
        if (specialtyInput) {
            specialtyInput.value = specialtyParam;
        }
    }

    // Book appointment button
    const bookBtn = document.getElementById('bookAppointment');
    if (bookBtn) {
        bookBtn.addEventListener('click', () => {
            alert('Appointment booking feature would be integrated here. This would typically connect to a calendar system or booking API.');
        });
    }
});

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getCurrentLocation, calculateDistance, userLocation };
}
