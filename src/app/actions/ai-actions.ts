'use server';

export async function queryStudyAssistant(prompt: string) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        // System instruction for the model
        const systemInstruction = `You are a strict, distraction-free Study Assistant Context Engine. 
Your ONLY purpose is to break down complex concepts into structural, easy-to-understand markdown formats. 
DO NOT use conversational fluff, greetings, or conclusions. Provide a direct, highly-structured breakdown.
Use concise bullet points, bold headers, and code blocks if relevant.`;

        // Mock response fallback if API key is missing
        if (!apiKey) {
            console.warn('[AI_ENGINE] GEMINI_API_KEY missing. Returning simulated response.');
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            return {
                success: true,
                content: `### ⚠️ SYSTEM NOTICE
[ CONTEXT_ENGINE // OFFLINE ]
Valid \`GEMINI_API_KEY\` not detected in environment variables. 

#### FALLBACK_SIMULATION
* **User Prompt:** \`${prompt}\`
* **Status:** Engine bypassed.
* **Instruction:** Provide a real API key to activate the live Gemini 2.5 Flash context engine.`
            };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.2, // Low temperature for focused, structural answers
                    maxOutputTokens: 1024,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('[AI_ENGINE] Gemini API Error:', errorData);
            return { success: false, error: 'Failed to retrieve context breakdown.' };
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            return { success: false, error: 'Empty response from Context Engine.' };
        }

        return { success: true, content: textContent };
        
    } catch (error) {
        console.error('[AI_ENGINE] Exception during query:', error);
        return { success: false, error: 'Internal context engine error.' };
    }
}
