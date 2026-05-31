'use client';

import { useState } from 'react';
import Link from 'next/link';

const MOCK_THREADS = [
  { id: '1', handle: 'dev_guy', preview: 'Want to review that PR later?', time: '2m', unread: true },
  { id: '2', handle: 'sarah_w', preview: 'The ambient track in The Library is great.', time: '1h', unread: false },
  { id: '3', handle: 'med_student', preview: 'Good luck on the exam!', time: '1d', unread: false },
];

const MOCK_MESSAGES = [
  { id: '1', sender: 'dev_guy', text: 'Hey, are you free for a quick code review?', time: '10:42 AM' },
  { id: '2', sender: 'me', text: 'Sure, I just finished my pomodoro block. Send the link.', time: '10:45 AM' },
  { id: '3', sender: 'dev_guy', text: 'Want to review that PR later?', time: '10:46 AM' },
];

export default function MessagesPage() {
  const [activeThread, setActiveThread] = useState('1');
  const [input, setInput] = useState('');

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      
      {/* Sidebar: Navigation + Threads */}
      <aside className="w-[280px] border-r border-border bg-surface flex flex-col flex-shrink-0">
        
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="font-[family-name:var(--font-primary)] text-xs text-secondary hover:text-foreground transition-colors uppercase tracking-widest">
            ← Dashboard
          </Link>
          <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-primary">Inbox</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {MOCK_THREADS.map(thread => (
            <button 
              key={thread.id}
              onClick={() => setActiveThread(thread.id)}
              className={`p-4 text-left border flex flex-col gap-2 transition-colors duration-120 ${
                activeThread === thread.id ? 'border-primary bg-primary/5' : 'border-border hover:border-secondary bg-background'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className={`font-[family-name:var(--font-primary)] text-xs uppercase tracking-wider truncate ${thread.unread ? 'text-primary' : 'text-foreground'}`}>
                  @{thread.handle}
                </span>
                <span className="font-[family-name:var(--font-primary)] text-[10px] text-secondary shrink-0">{thread.time}</span>
              </div>
              <p className={`font-[family-name:var(--font-primary)] text-xs truncate ${thread.unread ? 'text-foreground font-medium' : 'text-secondary'}`}>
                {thread.preview}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-background">
        
        {/* Header */}
        <header className="h-[72px] border-b border-border flex items-center px-8 shrink-0 bg-surface/30">
          <div className="font-[family-name:var(--font-primary)] text-sm uppercase tracking-wider">@dev_guy</div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
          {MOCK_MESSAGES.map(msg => (
            <div key={msg.id} className={`flex flex-col gap-1 max-w-[80%] ${msg.sender === 'me' ? 'self-end items-end' : 'self-start items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest text-secondary">
                  {msg.sender === 'me' ? 'YOU' : `@${msg.sender}`}
                </span>
                <span className="font-[family-name:var(--font-primary)] text-[10px] text-border">{msg.time}</span>
              </div>
              <div className={`p-4 font-[family-name:var(--font-primary)] text-sm border ${
                msg.sender === 'me' ? 'bg-surface border-border text-foreground' : 'bg-transparent border-border text-foreground'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-6 border-t border-border bg-surface">
          <div className="max-w-4xl mx-auto flex items-end gap-4">
            <textarea 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-background border border-border p-4 font-[family-name:var(--font-primary)] text-sm outline-none focus:border-primary transition-colors resize-none h-14 max-h-[120px]"
            />
            <button className="h-14 px-8 bg-foreground text-background font-[family-name:var(--font-primary)] font-semibold text-xs tracking-widest uppercase transition-transform duration-120 active:scale-[0.98]">
              Send
            </button>
          </div>
        </div>

      </main>

    </div>
  );
}
