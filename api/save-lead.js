const { createClient } = require('@supabase/supabase-js');

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
        const { session_id, lead_data } = req.body;
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(503).json({ error: 'Supabase not configured' });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // lead_data should contain: location_preference, budget, property_type, etc.
        const { data, error } = await supabase
            .from('lead_profiles')
            .upsert({
                session_id: session_id,
                ...lead_data,
                created_at: new Date()
            }, { onConflict: 'session_id' });

        if (error) throw error;

        res.status(200).json({ success: true, data });

    } catch (error) {
        console.error('Error in /api/save-lead:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
