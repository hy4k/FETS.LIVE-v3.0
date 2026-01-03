import { supabase } from './supabase';

/**
 * FETS Intelligence v5.0
 * Multi-Model Neural Fallback Engine
 * 
 * Automatically cycles through available models to bypass 404/Quota issues.
 */

const getApiKey = () => import.meta.env.VITE_AI_API_KEY;

export async function askGemini(userPrompt: string) {
    const apiKey = getApiKey();

    if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
        console.error("Gemini API Key Check Failed. Value:", apiKey);
        throw new Error("AI API Key is missing or invalid. Please configure VITE_AI_API_KEY in your environment.");
    }

    console.log("DEBUG: AI Engine Initializing with Key Length:", apiKey.length);
    console.log("DEBUG: Gathering context from Supabase...");

    // We fetch a comprehensive summary of the platform state to make the AI "Omniscient"
    const today = new Date().toISOString().split('T')[0];

    try {
        const [
            eventsRes,
            healthRes,
            newsRes,
            sessionsRes,
            incidentsRes,
            candidatesRes,
            staffRes,
            noticesRes,
            postsRes,
            branchRes
        ] = await Promise.all([
            supabase.from('events').select('title, category, branch_location, priority, status').or(`status.eq.open,created_at.gte.${today}`).limit(5),
            supabase.from('system_health_metrics').select('*'),
            supabase.from('news').select('content, priority').eq('is_active', true).limit(3),
            supabase.from('sessions').select('client_name, candidate_count, start_time, branch_location').eq('date', today),
            supabase.from('incidents').select('title, status, priority, branch_location').neq('status', 'closed').limit(5),
            supabase.from('candidates').select('*', { count: 'exact', head: true }),
            supabase.from('staff_profiles').select('full_name, role, department, is_online'),
            supabase.from('notices').select('title, content').limit(3),
            supabase.from('social_posts').select('content, user_id').order('created_at', { ascending: false }).limit(3),
            supabase.from('branch_status').select('*')
        ]);

        const events = eventsRes.data || [];
        const health = healthRes.data || [];
        const news = newsRes.data || [];
        const sessions = sessionsRes.data || [];
        const incidents = incidentsRes.data || [];
        const totalCandidates = candidatesRes.count || 0;
        const staff = staffRes.data || [];
        const onlineStaff = staff.filter((s: any) => s.is_online).length;
        const notices = noticesRes.data || [];
        const recentPosts = postsRes.data || [];
        const branchStatus = branchRes.data || [];

        console.log("DEBUG: Context check:", {
            events: events.length,
            health: health.length,
            news: news.length,
            sessions: sessions.length,
            incidents: incidents.length,
            totalCandidates,
            onlineStaff,
            branches: branchStatus.length
        });

        const context = `
            You are FETS Intelligence (v5.0), the elite operational backbone of the FETS.LIVE grid.
            Persona: Highly professional, analytical, concise, and futuristic.
            Current Time: ${new Date().toLocaleString()}

            [OPERATIONAL SNAPSHOT]
            - Total Candidates in System: ${totalCandidates}
            - Staff Online Now: ${onlineStaff}
            - Branches Monitored: ${branchStatus.length}
            
            [LIVE DATA FEED]
            1. ACTIVE EVENTS: ${JSON.stringify(events)}
            2. PENDING INCIDENTS: ${JSON.stringify(incidents)}
            3. TODAY'S EXAM SESSIONS: ${JSON.stringify(sessions)}
            4. SYSTEM HEALTH: ${JSON.stringify(health)}
            5. ACTIVE NOTICES: ${JSON.stringify(notices)}
            6. RECENT STAFF ACTIVITY: ${JSON.stringify(recentPosts)}
            7. BRANCH STATUS: ${JSON.stringify(branchStatus)}

            INSTRUCTIONS:
            - Provide data-driven answers using the snapshot above.
            - If data is not present, use logical operational reasoning (e.g., "Current sessions are typically scheduled for 9AM and 2PM").
            - Maintain an authoritative yet helpful tone.
        `;

        // FALLBACK ENGINE: Attempt different models if one fails
        const models = [
            { id: 'gemini-2.0-flash-exp', endpoint: 'v1beta' },
            { id: 'gemini-1.5-flash', endpoint: 'v1beta' },
            { id: 'gemini-1.5-pro', endpoint: 'v1beta' },
            { id: 'gemini-pro', endpoint: 'v1' }
        ];

        let lastError = null;

        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/${model.endpoint}/models/${model.id}:generateContent?key=${apiKey}`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: `Context: ${context}\n\nUser Query: ${userPrompt}\n\nStrict Output Mode: Answer concisely and accurately based on context.` }]
                        }]
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.warn(`WARN: Model ${model.id} failed:`, errorText);
                    lastError = new Error(`API Error ${response.status}: ${errorText}`);
                    continue;
                }

                const data = await response.json();
                const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (aiResponse) {
                    return aiResponse;
                }
            } catch (err) {
                console.warn(`WARN: Error calling ${model.id}:`, err);
                lastError = err;
            }
        }

        throw lastError || new Error("All AI models failed to respond.");

    } catch (error: any) {
        console.error("CRITICAL: FETS Intelligence Neural Failure:", error);
        throw error;
    }
}
