// Google Maps Integration
let map = null;
let markers = [];
let infoWindows = [];
let userMarker = null;

// Initialize map on search page
window.initMap = function() {
    // Default center (San Francisco)
    const defaultCenter = { lat: 37.7749, lng: -122.4194 };
    
    // Create map
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultCenter,
        zoom: 11,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    // Try to get user location and center map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center map on user location
                map.setCenter(userLocation);
                map.setZoom(12);
                
                // Add user location marker
                addUserMarker(userLocation);
            },
            () => {
                // If geolocation fails, use default center
                console.log('Geolocation not available, using default center');
            }
        );
    }

    // Load therapists on map
    loadTherapistsOnMap();
}

// Initialize map on therapist profile page
window.initTherapistMap = function() {
    // Therapist location (Dr. Sarah Johnson - default for demo)
    const therapistLocation = { lat: 37.7749, lng: -122.4194 };
    
    // Get therapist ID from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const therapistId = urlParams.get('id');
    
    // In production, fetch therapist data based on ID
    // For now, using default location
    
    const therapistMap = new google.maps.Map(document.getElementById('therapistMap'), {
        center: therapistLocation,
        zoom: 15,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });

    // Add marker for therapist
    const therapistMarker = new google.maps.Marker({
        position: therapistLocation,
        map: therapistMap,
        title: 'Therapist Location',
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
    });

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h3 style="margin: 0 0 5px 0; font-size: 16px;">Dr. Sarah Johnson, DPT</h3>
                <p style="margin: 0; color: #666; font-size: 14px;">123 Main Street, San Francisco, CA 94102</p>
            </div>
        `
    });

    therapistMarker.addListener('click', () => {
        infoWindow.open(therapistMap, therapistMarker);
    });

    // Try to add user location if available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Add user marker
                const userMarker = new google.maps.Marker({
                    position: userLocation,
                    map: therapistMap,
                    title: 'Your Location',
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    }
                });

                // Fit bounds to show both locations
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(therapistLocation);
                bounds.extend(userLocation);
                therapistMap.fitBounds(bounds);
            },
            () => {
                // If geolocation fails, just show therapist location
            }
        );
    }
}

// Add user location marker
function addUserMarker(location) {
    if (userMarker) {
        userMarker.setMap(null);
    }

    userMarker = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Your Location',
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(40, 40)
        },
        zIndex: 1000
    });
}

// Load therapists on the map
function loadTherapistsOnMap() {
    // Clear existing markers
    clearMarkers();

    // Get therapists from search results or use all therapists
    const therapistsToShow = window.currentTherapists || window.therapists || [];

    if (therapistsToShow.length === 0) {
        return;
    }

    const bounds = new google.maps.LatLngBounds();

    // Add user location to bounds if available
    if (userMarker) {
        bounds.extend(userMarker.getPosition());
    }

    // Add markers for each therapist
    therapistsToShow.forEach((therapist, index) => {
        const position = { lat: therapist.lat, lng: therapist.lng };
        
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: therapist.name,
            icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(32, 32)
            },
            animation: google.maps.Animation.DROP
        });

        // Create info window content
        const infoContent = `
            <div style="padding: 10px; max-width: 250px;">
                <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #2563eb;">${therapist.name}</h3>
                <p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">${therapist.specialty}</p>
                <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">📍 ${therapist.location}</p>
                ${therapist.distance ? `<p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">📏 ${therapist.distance} miles away</p>` : ''}
                <div style="margin-top: 8px;">
                    <span style="color: #fbbf24;">${'⭐'.repeat(Math.floor(therapist.rating))}</span>
                    <span style="color: #666; font-size: 12px; margin-left: 5px;">${therapist.rating} (${therapist.reviews} reviews)</span>
                </div>
                <a href="therapist-profile.html?id=${therapist.id}" 
                   style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                    View Profile
                </a>
            </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });

        // Add click listener
        marker.addListener('click', () => {
            // Close all other info windows
            infoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
        });

        markers.push(marker);
        infoWindows.push(infoWindow);
        bounds.extend(position);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
        if (userMarker) {
            map.fitBounds(bounds);
        } else {
            map.fitBounds(bounds);
        }
        
        // Adjust zoom if too zoomed out
        const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
            if (map.getZoom() > 15) {
                map.setZoom(15);
            }
            google.maps.event.removeListener(listener);
        });
    }
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    infoWindows.forEach(iw => iw.close());
    markers = [];
    infoWindows = [];
}

// Update map with new search results
function updateMapWithResults(therapists) {
    window.currentTherapists = therapists;
    if (map) {
        loadTherapistsOnMap();
    }
}

// Handle map initialization error
window.gm_authFailure = function() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 20px; text-align: center; color: #666;">
                <p style="font-size: 18px; margin-bottom: 10px;">⚠️ Google Maps API Error</p>
                <p style="font-size: 14px; margin-bottom: 10px;">Please check your API key in the HTML file.</p>
                <p style="font-size: 12px;">Replace "YOUR_API_KEY" with your actual Google Maps API key.</p>
            </div>
        `;
    }
};
