// AI Assistant Chat Widget
class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createWidget();
        this.loadTherapistData();
        this.addWelcomeMessage();
    }

    createWidget() {
        // Check if already created
        if (document.getElementById('aiChatButton')) {
            console.log('AI Assistant: Widget already exists');
            return;
        }

        // Create chat button
        const chatButton = document.createElement('button');
        chatButton.id = 'aiChatButton';
        chatButton.className = 'ai-chat-button';
        chatButton.innerHTML = '💬';
        chatButton.setAttribute('aria-label', 'Open Clara');
        chatButton.onclick = () => this.toggleChat();
        // Ensure button is visible with inline styles
        chatButton.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            width: 60px !important;
            height: 60px !important;
            border-radius: 50% !important;
            background: #2563eb !important;
            color: white !important;
            border: none !important;
            font-size: 24px !important;
            cursor: pointer !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
            z-index: 10000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        `;

        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.id = 'aiChatContainer';
        chatContainer.className = 'ai-chat-container';
        chatContainer.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-chat-header-content">
                    <h3>🤖 Clara</h3>
                    <p class="ai-chat-subtitle">I can help you navigate and use this website</p>
                </div>
                <button class="ai-chat-close" onclick="window.aiAssistant.toggleChat()">×</button>
            </div>
            <div class="ai-chat-messages" id="aiChatMessages"></div>
            <div class="ai-chat-input-container">
                <input 
                    type="text" 
                    id="aiChatInput" 
                    class="ai-chat-input" 
                    placeholder="Ask me anything... (e.g., 'Find orthopedic therapists near me')"
                    autocomplete="off"
                />
                <button class="ai-chat-send" onclick="window.aiAssistant.sendMessage()">Send</button>
            </div>
        `;

        if (document.body) {
            document.body.appendChild(chatButton);
            document.body.appendChild(chatContainer);
            console.log('AI Assistant: Widget created successfully');
        } else {
            console.error('AI Assistant: document.body not available');
        }

        // Enter key support
        const input = document.getElementById('aiChatInput');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    loadTherapistData() {
        // Load therapist data from search.js if available
        // Wait a bit for search.js to load if needed
        setTimeout(() => {
            if (typeof therapists !== 'undefined') {
                this.therapists = therapists;
            }
        }, 100);
        
        // Fallback data (used immediately)
        this.therapists = [
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
                    description: 'Certified in women\'s health and pelvic floor physical therapy.'
                }
            ];
        }
    }

    addWelcomeMessage() {
        const welcomeMessage = `Hi! I'm Clara, your AI assistant. I can help you:
• Search for therapists by specialty or location
• Navigate the website
• Get location information
• Book appointments
• Answer questions about therapists

Try asking: "Find orthopedic therapists near me" or "Show me therapists in San Francisco"`;
        this.addMessage('assistant', welcomeMessage);
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const container = document.getElementById('aiChatContainer');
        const button = document.getElementById('aiChatButton');
        
        if (this.isOpen) {
            container.classList.add('ai-chat-open');
            button.classList.add('ai-chat-button-active');
            document.getElementById('aiChatInput').focus();
        } else {
            container.classList.remove('ai-chat-open');
            button.classList.remove('ai-chat-button-active');
        }
    }

    addMessage(sender, text, isHTML = false) {
        const messagesContainer = document.getElementById('aiChatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-chat-message ai-chat-message-${sender}`;
        
        if (isHTML) {
            messageDiv.innerHTML = text;
        } else {
            messageDiv.textContent = text;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        this.messages.push({ sender, text });
    }

    async sendMessage() {
        const input = document.getElementById('aiChatInput');
        const userMessage = input.value.trim();
        
        if (!userMessage) return;
        
        // Add user message
        this.addMessage('user', userMessage);
        input.value = '';
        
        // Show typing indicator
        const typingId = this.showTyping();
        
        // Process message
        try {
            const response = await this.processMessage(userMessage);
            this.hideTyping(typingId);
            this.addMessage('assistant', response.text, response.isHTML || false);
        } catch (error) {
            this.hideTyping(typingId);
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            console.error('AI Assistant Error:', error);
        }
    }

    showTyping() {
        const messagesContainer = document.getElementById('aiChatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'aiTypingIndicator';
        typingDiv.className = 'ai-chat-message ai-chat-message-assistant ai-typing';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return 'aiTypingIndicator';
    }

    hideTyping(typingId) {
        const typing = document.getElementById(typingId);
        if (typing) typing.remove();
    }

    async processMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Intent detection
        if (this.matchesIntent(lowerMessage, ['search', 'find', 'look for', 'show me', 'get me'])) {
            return await this.handleSearch(message);
        } else if (this.matchesIntent(lowerMessage, ['navigate', 'go to', 'open', 'show', 'take me'])) {
            return await this.handleNavigation(message);
        } else if (this.matchesIntent(lowerMessage, ['book', 'schedule', 'appointment', 'make an appointment'])) {
            return await this.handleBooking(message);
        } else if (this.matchesIntent(lowerMessage, ['location', 'where am i', 'my location', 'near me'])) {
            return await this.handleLocation(message);
        } else if (this.matchesIntent(lowerMessage, ['help', 'what can you', 'how do i', 'how can'])) {
            return this.handleHelp();
        } else if (this.matchesIntent(lowerMessage, ['about', 'tell me about', 'info', 'information'])) {
            return await this.handleInfo(message);
        } else {
            return await this.handleGeneral(message);
        }
    }

    matchesIntent(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }

    async handleSearch(message) {
        const lowerMessage = message.toLowerCase();
        
        // Extract specialty
        const specialties = ['orthopedic', 'sports', 'pediatric', 'geriatric', 'neurological', 'women', 'pelvic', 'balance', 'performance'];
        let specialty = null;
        for (const spec of specialties) {
            if (lowerMessage.includes(spec)) {
                specialty = spec;
                break;
            }
        }
        
        // Extract location
        let location = null;
        const locationPatterns = [
            /(?:in|near|at|around)\s+([a-z\s]+(?:,\s*[a-z]{2})?)/i,
            /([a-z\s]+(?:,\s*[a-z]{2})?)\s+therapist/i,
            /(?:zip|postal)\s+code\s+(\d{5})/i,
            /(\d{5})/i
        ];
        
        for (const pattern of locationPatterns) {
            const match = message.match(pattern);
            if (match) {
                location = match[1].trim();
                break;
            }
        }
        
        // Check for "near me"
        if (lowerMessage.includes('near me') || lowerMessage.includes('close to me')) {
            location = await this.getUserLocation();
        }
        
        // Use existing filterTherapists function if available, otherwise use our own
        let results;
        if (typeof filterTherapists === 'function') {
            results = filterTherapists(specialty || '', location || '');
        } else {
            // Fallback filtering
            results = [...this.therapists];
            
            if (specialty) {
                results = results.filter(t => 
                    t.specialty.toLowerCase().includes(specialty) ||
                    t.description.toLowerCase().includes(specialty)
                );
            }
            
            if (location) {
                const locationLower = location.toLowerCase();
                results = results.filter(t => 
                    t.location.toLowerCase().includes(locationLower)
                );
            }
            
            // Sort by rating if no location specified
            if (!location || !window.userLocation) {
                results.sort((a, b) => b.rating - a.rating);
            } else {
                // Calculate distances if user location available
                results.forEach(t => {
                    t.distance = this.calculateDistance(
                        window.userLocation.latitude,
                        window.userLocation.longitude,
                        t.lat,
                        t.lng
                    );
                });
                results.sort((a, b) => a.distance - b.distance);
            }
        }
        
        if (results.length === 0) {
            return {
                text: `I couldn't find any therapists matching your criteria. Try searching with different keywords or check the search page.`,
                isHTML: false
            };
        }
        
        // Create results HTML
        let resultsHTML = `I found ${results.length} therapist${results.length > 1 ? 's' : ''}:\n\n`;
        results.slice(0, 5).forEach((therapist, index) => {
            resultsHTML += `${index + 1}. <strong>${therapist.name}</strong>\n`;
            resultsHTML += `   Specialty: ${therapist.specialty}\n`;
            resultsHTML += `   Location: ${therapist.location}\n`;
            if (therapist.distance) {
                resultsHTML += `   Distance: ${therapist.distance.toFixed(1)} miles\n`;
            }
            resultsHTML += `   Rating: ${'⭐'.repeat(Math.floor(therapist.rating))} ${therapist.rating} (${therapist.reviews} reviews)\n`;
            resultsHTML += `   <a href="therapist-profile.html?id=${therapist.id}" style="color: #2563eb; text-decoration: underline;">View Profile</a>\n\n`;
        });
        
        if (results.length > 5) {
            resultsHTML += `... and ${results.length - 5} more. <a href="search.html?specialty=${specialty || ''}&location=${location || ''}" style="color: #2563eb; text-decoration: underline;">View all results</a>`;
        } else {
            resultsHTML += `<a href="search.html?specialty=${specialty || ''}&location=${location || ''}" style="color: #2563eb; text-decoration: underline;">View on search page</a>`;
        }
        
        // Navigate to search page with results (after showing message)
        setTimeout(() => {
            const params = new URLSearchParams();
            if (specialty) params.set('specialty', specialty);
            if (location) params.set('location', location);
            
            // If we're already on search page, trigger search
            if (window.location.pathname.includes('search.html')) {
                // Update URL and trigger search
                window.history.pushState({}, '', `search.html?${params.toString()}`);
                if (typeof filterTherapists === 'function') {
                    const searchResults = filterTherapists(specialty, location);
                    if (typeof displayResults === 'function') {
                        displayResults(searchResults);
                    }
                }
            } else {
                window.location.href = `search.html?${params.toString()}`;
            }
        }, 2000);
        
        return {
            text: resultsHTML,
            isHTML: true
        };
    }

    async handleNavigation(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('home') || lowerMessage.includes('main')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
            return { text: 'Taking you to the home page...', isHTML: false };
        } else if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
            setTimeout(() => {
                window.location.href = 'search.html';
            }, 500);
            return { text: 'Taking you to the search page...', isHTML: false };
        } else if (lowerMessage.includes('profile') || lowerMessage.includes('therapist')) {
            // Try to extract therapist name or ID
            const therapistMatch = message.match(/(?:dr\.?\s*)?([a-z]+(?:\s+[a-z]+)?)/i);
            if (therapistMatch) {
                const name = therapistMatch[1].toLowerCase();
                const therapist = this.therapists.find(t => 
                    t.name.toLowerCase().includes(name)
                );
                if (therapist) {
                    setTimeout(() => {
                        window.location.href = `therapist-profile.html?id=${therapist.id}`;
                    }, 500);
                    return { text: `Taking you to ${therapist.name}'s profile...`, isHTML: false };
                }
            }
            return { text: 'Which therapist profile would you like to see? You can search for therapists first.', isHTML: false };
        } else {
            return { text: 'I can take you to: Home, Search, or Therapist Profiles. Where would you like to go?', isHTML: false };
        }
    }

    async handleBooking(message) {
        // Extract therapist name if mentioned
        const therapistMatch = message.match(/(?:dr\.?\s*)?([a-z]+(?:\s+[a-z]+)?)/i);
        let therapistName = null;
        
        if (therapistMatch) {
            const name = therapistMatch[1].toLowerCase();
            const therapist = this.therapists.find(t => 
                t.name.toLowerCase().includes(name)
            );
            if (therapist) {
                therapistName = therapist.name;
            }
        }
        
        if (therapistName) {
            const therapist = this.therapists.find(t => t.name === therapistName);
            if (therapist) {
                setTimeout(() => {
                    window.location.href = `therapist-profile.html?id=${therapist.id}`;
                    // After navigation, trigger booking
                    setTimeout(() => {
                        const bookBtn = document.getElementById('bookAppointment');
                        if (bookBtn) {
                            bookBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            bookBtn.focus();
                        }
                    }, 1000);
                }, 500);
                return {
                    text: `I'm taking you to ${therapistName}'s profile. You can click the "Book Appointment" button there to schedule your appointment.`,
                    isHTML: false
                };
            }
        }
        
        return {
            text: `To book an appointment, first search for a therapist and then visit their profile page. You can say "Find orthopedic therapists" or "Show me therapists near me" to get started.`,
            isHTML: false
        };
    }

    async handleLocation(message) {
        const location = await this.getUserLocation();
        
        if (location) {
            return {
                text: `Your location is: ${location.address || 'Lat: ' + location.latitude + ', Lng: ' + location.longitude}. I can use this to find therapists near you!`,
                isHTML: false
            };
        } else {
            return {
                text: `I couldn't get your location. Please allow location access or manually enter your location when searching.`,
                isHTML: false
            };
        }
    }

    handleHelp() {
        return {
            text: `I'm Clara, and I can help you with:
• <strong>Searching:</strong> "Find orthopedic therapists near me"
• <strong>Navigation:</strong> "Go to search page" or "Show me home"
• <strong>Booking:</strong> "Book appointment with Dr. Sarah Johnson"
• <strong>Location:</strong> "Where am I?" or "Get my location"
• <strong>Information:</strong> "Tell me about Dr. Sarah Johnson"

Just ask me naturally and I'll help!`,
            isHTML: true
        };
    }

    async handleInfo(message) {
        // Check if asking about a specific therapist
        const therapistMatch = message.match(/(?:dr\.?\s*)?([a-z]+(?:\s+[a-z]+)?)/i);
        
        if (therapistMatch) {
            const name = therapistMatch[1].toLowerCase();
            const therapist = this.therapists.find(t => 
                t.name.toLowerCase().includes(name)
            );
            
            if (therapist) {
                let info = `<strong>${therapist.name}</strong>\n\n`;
                info += `Specialty: ${therapist.specialty}\n`;
                info += `Location: ${therapist.location}\n`;
                info += `Rating: ${'⭐'.repeat(Math.floor(therapist.rating))} ${therapist.rating} (${therapist.reviews} reviews)\n`;
                info += `Description: ${therapist.description}\n\n`;
                info += `<a href="therapist-profile.html?id=${therapist.id}" style="color: #2563eb; text-decoration: underline;">View Full Profile</a>`;
                
                return { text: info, isHTML: true };
            }
        }
        
        return {
            text: `I can tell you about any therapist. Try asking: "Tell me about Dr. Sarah Johnson" or search for therapists first.`,
            isHTML: false
        };
    }

    async     handleGeneral(message) {
        // Try to be helpful with general queries
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return {
                text: 'Hello! I\'m Clara. How can I help you today? You can ask me to search for therapists, navigate the site, or get information.',
                isHTML: false
            };
        } else if (lowerMessage.includes('thank')) {
            return {
                text: "You're welcome! Is there anything else I can help you with?",
                isHTML: false
            };
        } else {
            return {
                text: `I'm Clara, and I'm here to help you navigate and use this website. You can ask me to:
• Search for therapists
• Navigate to different pages
• Get location information
• Book appointments
• Get information about therapists

Try: "Find orthopedic therapists near me" or "Go to search page"`,
                isHTML: false
            };
        }
    }

    async getUserLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    
                    window.userLocation = location;
                    
                    // Try to reverse geocode
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`,
                            {
                                headers: {
                                    'User-Agent': 'TherapistConnect/1.0'
                                }
                            }
                        );
                        const data = await response.json();
                        if (data && data.address) {
                            const addr = data.address;
                            location.address = `${addr.city || addr.town || ''} ${addr.state || ''} ${addr.postcode || ''}`.trim();
                        }
                    } catch (error) {
                        console.error('Reverse geocoding error:', error);
                    }
                    
                    resolve(location);
                },
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
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
}

// Initialize AI Assistant when DOM is ready
function initAIAssistant() {
    if (document.body) {
        try {
            window.aiAssistant = new AIAssistant();
            console.log('AI Assistant initialized successfully');
        } catch (error) {
            console.error('AI Assistant initialization error:', error);
        }
    } else {
        // If body doesn't exist yet, wait a bit
        console.log('AI Assistant: Waiting for document.body...');
        setTimeout(initAIAssistant, 100);
    }
}

// Try multiple initialization methods
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('AI Assistant: DOMContentLoaded fired');
        initAIAssistant();
    });
} else {
    // DOM is already ready
    console.log('AI Assistant: DOM already ready');
    initAIAssistant();
}

// Fallback initialization
setTimeout(() => {
    if (!window.aiAssistant) {
        console.log('AI Assistant: Fallback initialization');
        initAIAssistant();
    }
}, 1000);
