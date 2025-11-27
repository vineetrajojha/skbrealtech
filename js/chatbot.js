document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const API_URL = '/api'; // Relative path for Vercel
    const SESSION_ID = 'session_' + Math.random().toString(36).substr(2, 9);

    // State
    let isOpen = false;
    let messages = [];

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
                <!-- Suggestions will appear here -->
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

    // Initial Suggestions
    const initialSuggestions = [
        "Show me properties in my budget",
        "What areas are best for families?",
        "Do you have pet-friendly apartments?",
        "What is available in my preferred location?"
    ];

    // Helper Functions
    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            window.classList.add('active');
            fab.style.display = 'none';
            if (messages.length === 0) {
                addBotMessage("Hi, I’m your Realtech assistant 👋 How can I help you with properties today?");
                addBotMessage("Let’s get started with a few quick questions.");
                renderSuggestions();
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

    function renderSuggestions() {
        suggestionsContainer.innerHTML = '';
        initialSuggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.classList.add('suggestion-chip');
            chip.textContent = suggestion;
            chip.onclick = () => handleSend(suggestion);
            suggestionsContainer.appendChild(chip);
        });
    }

    async function handleSend(text) {
        if (!text.trim()) return;

        addUserMessage(text);
        input.value = '';

        // Show loading state (optional)
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

            // Remove loading
            const loadingMsg = document.getElementById('loading-msg');
            if (loadingMsg) loadingMsg.remove();

            if (data.response) {
                addBotMessage(data.response);

                // Save conversation
                saveConversation();

                // Extract preferences periodically or after specific milestones
                if (messages.length % 4 === 0) {
                    extractPreferences();
                }
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

    async function extractPreferences() {
        try {
            await fetch(`${API_URL}/extract-preferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: SESSION_ID, messages: messages })
            });
        } catch (e) {
            console.warn('Failed to extract preferences:', e);
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
