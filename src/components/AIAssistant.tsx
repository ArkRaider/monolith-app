'use client';

import { useState } from 'react';
import { queryStudyAssistant } from '@/app/actions/ai-actions';
import { Send, Terminal } from 'lucide-react';

export function AIAssistant() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || loading) return;

        setLoading(true);
        setResponse(''); // Clear previous response
        const res = await queryStudyAssistant(prompt.trim());
        if (res.success && res.content) {
            setResponse(res.content);
            setPrompt(''); // Clear input on success
        } else {
            setResponse(`[ERROR] // ${res.error || 'Connection Failed'}`);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-surface">
            {/* Context Engine Banner */}
            <div className="p-4 border-b-[length:var(--border-weight)] border-border bg-foreground text-background flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal size={16} />
                    <span className="font-[family-name:var(--font-primary)] text-xs uppercase font-black tracking-widest">[ CONTEXT_ENGINE // ACTIVE ]</span>
                </div>
            </div>

            {/* Response Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-background">
                {loading ? (
                    <div className="font-[family-name:var(--font-primary)] text-xs text-primary font-bold animate-pulse uppercase tracking-widest whitespace-pre-wrap">
                        {'// RETRIEVING_AI_EXPLANATION....'}
                    </div>
                ) : response ? (
                    <div className="font-[family-name:var(--font-primary)] text-xs text-foreground whitespace-pre-wrap">
                        {response}
                    </div>
                ) : (
                    <div className="font-[family-name:var(--font-primary)] text-[10px] text-secondary uppercase tracking-widest opacity-50 h-full flex items-center justify-center text-center">
                        AWAITING_INPUT // PASTE CONCEPTS, CODE SNIPPETS, OR QUESTIONS BELOW
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t-[length:var(--border-weight)] border-border bg-surface-high">
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="ENTER QUERY DIRECTIVE..."
                        className="w-full min-h-[100px] resize-none bg-background border-[length:var(--border-weight)] border-border text-foreground text-xs font-[family-name:var(--font-primary)] uppercase p-2 outline-none focus:border-primary placeholder:text-secondary/50 transition-colors"
                    />
                    <button 
                        type="submit"
                        disabled={!prompt.trim() || loading}
                        className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-2 border-[length:var(--border-weight)] border-border uppercase font-bold text-xs tracking-widest hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>EXECUTE</span>
                        <Send size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
}
