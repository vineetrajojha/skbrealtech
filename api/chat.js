const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = "You are a Realtech real estate assistant. Stay within real estate topics. Collect user preferences through conversation. Ask one question at a time. Allow free chat. Extract structured preferences from the conversation.";

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { message, history } = req.body;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            return res.status(503).json({ error: 'Gemini API not configured' });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am ready to assist with real estate inquiries." }],
                },
                ...history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ response: text });

    } catch (error) {
        console.error('Error in /api/chat:', error);
        // Return detailed error for debugging
        res.status(500).json({ error: 'Internal Server Error', details: error.message, stack: error.stack });
    }
};
