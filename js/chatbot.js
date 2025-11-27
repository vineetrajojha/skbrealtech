document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const API_URL = '/api'; // Relative path for Vercel
    const SESSION_ID = 'session_' + Math.random().toString(36).substr(2, 9);

    // State
    let isOpen = false;
    let messages = [];
    let currentStep = 0;
    let leadData = {};

    // Guided Questions Flow
    const steps = [
        {
            id: 'location',
            message: "Which location or area are you interested in? (City, Neighbourhood, Locality)",
            field: 'location_preference'
        },
        {
            id: 'intent',
            message: "Are you looking to buy, rent, or invest?",
            field: 'intent',
            options: ["Buy", "Rent", "Invest"]
        },
        {
            id: 'budget',
            message: "What’s your budget range?",
            field: 'budget'
        },
        {
            id: 'property_type',
            message: "What type of property are you looking for?",
            field: 'property_type',
            options: ["Apartment", "Flat", "Villa", "Independent House", "Studio Home", "Commercial"]
        },
        {
            id: 'bedrooms',
            message: "How many bedrooms do you prefer?",
            field: 'bedrooms',
            options: ["1 BHK", "2 BHK", "3 BHK", "4+ BHK"]
        },
        {
            id: 'special_preferences',
            message: "Any special preferences? (e.g., Pet-friendly, Gated community, Near metro)",
            field: 'special_preferences'
        },
        {
            id: 'move_in',
            message: "What is your preferred move-in timeline?",
            field: 'move_in_timeline',
            options: ["Immediately", "In 1–2 months", "Planning ahead"]
        },
        {
            id: 'builders',
            message: "Do you have any specific builders or projects in mind?",
            field: 'preferred_builders'
        },
        {
            id: 'visit',
            message: "How soon would you like to schedule a property visit?",
            field: 'visit_timeline',
            options: ["ASAP", "This Weekend", "Next Week", "Later"]
        },
        {
            id: 'contact',
            message: "Can I get your name & number so our expert can assist you better?",
            field: 'contact_details'
        }
    ];

    // Create Widget HTML
    const widgetHTML = `
        <div class="chatbot-fab" id="chatbot-fab">
            <i class="fas fa-comment-dots"></i>
        </div>
        <div class="chatbot-window" id="chatbot-window">
            <div class="chatbot-header">
                <span class="chatbot-title">Realtech Assistant</span>
                <button class="chatbot-close" id="chatbot-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <!-- Messages will appear here -->
            </div>
            <div class="chatbot-suggestions" id="chatbot-suggestions">
                <!-- Options will appear here -->
            </div>
            <div class="chatbot-input-area">
                <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Type a message...">
                <button class="chatbot-send-btn" id="chatbot-send"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    `;

    // Inject Widget
    const container = document.createElement('div');
    container.innerHTML = widgetHTML;
    document.body.appendChild(container);

    // Elements
    const fab = document.getElementById('chatbot-fab');
    const window = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const messagesContainer = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const suggestionsContainer = document.getElementById('chatbot-suggestions');

    // Helper Functions
    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            window.classList.add('active');
            fab.style.display = 'none';
            if (messages.length === 0) {
                // Start the flow
                processStep();
            }
        } else {
            window.classList.remove('active');
            fab.style.display = 'flex';
        }
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        messages.push({ role: sender === 'user' ? 'user' : 'model', content: text });
    }

    function addBotMessage(text) {
        addMessage(text, 'bot');
    }

    function addUserMessage(text) {
        addMessage(text, 'user');
    }

    function processStep() {
        if (currentStep < steps.length) {
            const step = steps[currentStep];
            addBotMessage(step.message);

            // Render options if available
            if (step.options) {
                renderOptions(step.options);
            } else {
                suggestionsContainer.innerHTML = ''; // Clear options
            }
        } else {
            addBotMessage("Thank you! I've noted all your details. You can now ask me any specific questions.");
            suggestionsContainer.innerHTML = '';
        }
    }

    function renderOptions(options) {
        suggestionsContainer.innerHTML = '';
        options.forEach(option => {
            const chip = document.createElement('div');
            chip.classList.add('suggestion-chip');
            chip.textContent = option;
            chip.onclick = () => handleSend(option);
            suggestionsContainer.appendChild(chip);
        });
    }

    async function handleSend(text) {
        if (!text.trim()) return;

        addUserMessage(text);
        input.value = '';
        suggestionsContainer.innerHTML = ''; // Clear options after selection

        // Guided Flow Logic
        if (currentStep < steps.length) {
            const step = steps[currentStep];

            // Save data
            if (step.field) {
                leadData[step.field] = text;
            }

            // Move to next step
            currentStep++;

            if (currentStep < steps.length) {
                setTimeout(() => processStep(), 500);
            } else {
                // Flow finished
                saveLeadData();
                setTimeout(() => {
                    addBotMessage("Thank you! I've noted all your details. You can now ask me any specific questions.");
                }, 500);
            }

            saveConversation();
            return;
        }

        // Free Chat Logic (Gemini)
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'bot');
        loadingDiv.textContent = '...';
        loadingDiv.id = 'loading-msg';
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: messages })
            });

            const data = await response.json();

            const loadingMsg = document.getElementById('loading-msg');
            if (loadingMsg) loadingMsg.remove();

            if (data.response) {
                addBotMessage(data.response);
                saveConversation();
            } else {
                addBotMessage("Sorry, I'm having trouble connecting right now.");
            }

        } catch (error) {
            console.error('Chat error:', error);
            const loadingMsg = document.getElementById('loading-msg');
            if (loadingMsg) loadingMsg.remove();
            addBotMessage("Sorry, something went wrong. Please check your connection.");
        }
    }

    async function saveConversation() {
        try {
            await fetch(`${API_URL}/save-conversation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: SESSION_ID, messages: messages })
            });
        } catch (e) {
            console.warn('Failed to save conversation:', e);
        }
    }

    async function saveLeadData() {
        try {
            await fetch(`${API_URL}/save-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: SESSION_ID, lead_data: leadData })
            });
        } catch (e) {
            console.warn('Failed to save lead data:', e);
        }
    }

    // Event Listeners
    fab.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    sendBtn.addEventListener('click', () => handleSend(input.value));
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend(input.value);
    });
});
