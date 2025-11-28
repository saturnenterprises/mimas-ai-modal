import { CONFIG } from './config.js';

// Call Gemini API
// Call Gemini API
async function getApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            resolve(result.geminiApiKey || CONFIG.GEMINI_API_KEY);
        });
    });
}

async function callGemini(prompt) {
    const key = await getApiKey();
    const model = CONFIG.GEMINI_MODEL;

    if (!key || key.includes('YOUR_')) {
        throw new Error('Gemini API Key is missing. Please set it in the extension options.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error: ${response.status} ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Synthesize results (Pure LLM Analysis)
async function synthesizeResults(text, author) {
    const authorContext = author ? `
    Author Context:
    - Handle: ${author.handle}
    - Verified: ${author.verified ? "Yes" : "No"}
    - Name: ${author.name}
    ` : "Author Context: Unknown";

    const prompt = `
    Analyze the following tweet for accuracy and credibility.
    
    Tweet: "${text}"
    
    ${authorContext}
    
    Task:
    1. Determine the verdict. Choose ONE of the following categories:
       - "True" (Factually accurate)
       - "Likely True" (Probable, but lacks definitive proof)
       - "Unverified" (Insufficient evidence, or a random account making a wild claim)
       - "Likely False" (Dubious, lacks context, or suspicious)
       - "False" (Demonstrably incorrect)
       
    2. Logic for "Unverified":
       - If the author is NOT verified (no blue check) AND the claim is sensational, controversial, or lacks sources, default to "Unverified" or "Likely False".
       - Be skeptical of "random accounts".
       
    3. Write a 1-2 sentence summary explaining the verdict.
    
    Output Format (JSON):
    {
      "verdict": "Category Name",
      "summary": "..."
    }
  `;

    try {
        const responseText = await callGemini(prompt);
        // Clean up markdown code blocks if present
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(jsonStr);
        return {
            verdict: result.verdict,
            summary: result.summary,
            sources: [] // No external sources
        };
    } catch (e) {
        console.error('Synthesis failed:', e);
        return {
            verdict: 'Error',
            summary: 'Failed to analyze text.',
            sources: []
        };
    }
}

// Chat with Agent
export async function chatWithAgent(question, context) {
    try {
        const prompt = `
      You are a helpful fact-checking assistant.
      
      Context:
      Tweet: "${context.tweetText}"
      Initial Analysis: ${JSON.stringify(context.analysis)}
      Deep Verification Findings: "${context.agentResult}"
      
      User Question: "${question}"
      
      Answer the user's question based on the context provided. Be concise, objective, and helpful.
    `;

        const reply = await callGemini(prompt);
        return { reply };
    } catch (error) {
        console.error('Chat error:', error);
        return { error: error.message };
    }
}

// Main Agent Function
export async function verifyClaim(payload) {
    // Payload can be just text (string) or object { text, author }
    const text = typeof payload === 'string' ? payload : payload.text;
    const author = typeof payload === 'object' ? payload.author : null;

    try {
        // Direct LLM Verification
        const result = await synthesizeResults(text, author);

        return {
            claim: text.substring(0, 100),
            ...result
        };

    } catch (error) {
        console.error('Agent verification failed:', error);
        return {
            error: error.message
        };
    }
}
