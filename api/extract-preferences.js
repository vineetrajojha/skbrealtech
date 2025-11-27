const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const EXTRACTION_PROMPT = "Read the following conversation and output ONLY in JSON with fields: location_preference, budget, property_type, special_preferences.";

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
        const { messages, session_id } = req.body;
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        if (!geminiApiKey) {
            return res.status(503).json({ error: 'Gemini API not configured' });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        const prompt = `${EXTRACTION_PROMPT}\n\nConversation:\n${conversationText}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Attempt to parse JSON
        let preferences = {};
        try {
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            preferences = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('Failed to parse extraction JSON:', e);
            preferences = { raw_extraction: text };
        }

        // Save to Supabase if available
        if (supabaseUrl && supabaseKey && session_id) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            await supabase.from('lead_profiles').upsert({
                session_id: session_id,
                ...preferences,
                created_at: new Date()
            }, { onConflict: 'session_id' });
        }

        res.status(200).json({ preferences });

    } catch (error) {
        console.error('Error in /api/extract-preferences:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
