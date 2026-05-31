'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { GlobalPomodoro } from '@/components/GlobalPomodoro';
import { useTodos } from '@/hooks/useTodos';

// ── Live Clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-GB', {
        hour:   '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="border-[length:var(--border-weight)] border-border p-3 font-mono text-center"
      style={{ background: 'var(--color-background)' }}
    >
      <span className="text-secondary text-[9px] font-[family-name:var(--font-primary)] uppercase tracking-widest font-bold block mb-1">
        TIME
      </span>
      <span className="text-foreground text-lg font-black tracking-widest">
        {time || '--:--:--'}
      </span>
    </div>
  );
}

// ── Todo Row with hover-to-delete ─────────────────────────────────────────────
function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: { id: string; text: string; done: boolean; xp: number };
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHover = () => {
    hoverTimer.current = setTimeout(() => setShowDelete(true), 2500);
  };

  const endHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowDelete(false);
  };

  return (
    <div
      className="relative flex items-center gap-3 p-2 bg-surface hover:bg-surface-high cursor-pointer transition-colors border-[length:var(--border-weight)] border-border group"
      onMouseEnter={startHover}
      onMouseLeave={endHover}
    >
      {/* Square checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onToggle(); }}
        className="shrink-0 w-4 h-4 border-[length:var(--border-weight)] border-border flex items-center justify-center transition-colors"
        style={{
          background: todo.done ? 'var(--color-primary)' : 'transparent',
          borderColor: todo.done ? 'var(--color-primary)' : undefined,
        }}
        aria-label={todo.done ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.done && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4L3 6L7 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--color-primary-foreground)' }} />
          </svg>
        )}
      </button>

      <span
        className={`flex-1 font-[family-name:var(--font-primary)] text-xs uppercase truncate transition-colors ${
          todo.done ? 'text-secondary line-through' : 'text-foreground'
        }`}
        onClick={onToggle}
      >
        {todo.text}
      </span>

      <span
        className={`text-[10px] font-bold font-[family-name:var(--font-primary)] shrink-0 ${
          todo.done ? 'text-secondary' : 'text-primary'
        }`}
        onClick={onToggle}
      >
        +{todo.xp} XP
      </span>

      {/* Hover-to-delete button — fades in after 2.5s hover */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="shrink-0 font-[family-name:var(--font-primary)] text-[9px] font-black uppercase tracking-widest transition-all duration-300"
        style={{
          color:   'var(--color-primary)',
          opacity: showDelete ? 1 : 0,
          pointerEvents: showDelete ? 'auto' : 'none',
          transform: showDelete ? 'translateX(0)' : 'translateX(4px)',
        }}
      >
        [ DELETE ]
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function TaskDeck({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<'notes' | 'todo' | 'xp'>('notes');
  const [text, setText] = useState('');
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoXp, setNewTodoXp] = useState(25);

  const {
    todos,
    activeTodos,
    completionRate,
    dailyGained,
    dailyGoal,
    xpPercentage,
    addTodo,
    toggleTodo,
    clearDone,
    deleteTodo,
  } = useTodos(userId);

  useEffect(() => {
    const savedNotes = localStorage.getItem(`room_notes_${userId}`);
    if (savedNotes) {
      // Use a functional update to avoid direct setState in effect
      setTimeout(() => {
        setText(savedNotes);
      }, 0);
    }
  }, [userId]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    localStorage.setItem(`room_notes_${userId}`, val);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    addTodo(newTodoText.trim(), newTodoXp);
    setNewTodoText('');
  };

  const hasDone = todos.some(t => t.done);

  return (
    <div className="flex flex-col h-full bg-surface-high border-l-[length:var(--border-weight)] border-border relative">
      {/* Tab Bar */}
      <div className="p-4 border-b-[length:var(--border-weight)] border-border flex items-center justify-between">
        <div className="flex gap-4">
          {(['notes', 'todo', 'xp'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-[family-name:var(--font-primary)] text-sm font-bold uppercase tracking-widest transition-colors outline-none ${
                activeTab === tab ? 'text-primary' : 'text-secondary hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {activeTab === 'todo' && hasDone && (
          <button
            onClick={clearDone}
            className="text-[10px] text-secondary hover:text-primary uppercase tracking-widest font-bold font-[family-name:var(--font-primary)]"
          >
            Clear Done
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden p-4 pb-52">
        {activeTab === 'notes' && (
          <textarea
            value={text}
            onChange={handleNotesChange}
            placeholder="WRITE YOUR NOTES HERE..."
            className="w-full h-full bg-transparent resize-none outline-none font-[family-name:var(--font-primary)] text-sm text-foreground placeholder:text-secondary leading-relaxed"
            spellCheck={false}
          />
        )}

        {activeTab === 'todo' && (
          <div className="flex flex-col h-full">
            {/* Add Task Form */}
            <form onSubmit={handleAddTodo} className="mb-4 flex gap-2 items-end">
              <input
                type="text"
                value={newTodoText}
                onChange={e => setNewTodoText(e.target.value)}
                placeholder="NEW TASK..."
                className="flex-1 bg-transparent border-b-[length:var(--border-weight)] border-border py-1 text-xs font-[family-name:var(--font-primary)] uppercase outline-none text-foreground placeholder:text-secondary focus:border-primary transition-colors"
              />
              <select
                value={newTodoXp}
                onChange={e => setNewTodoXp(Number(e.target.value))}
                className="bg-background border-b-[length:var(--border-weight)] border-border py-1 text-[10px] font-bold font-[family-name:var(--font-primary)] uppercase text-primary outline-none"
              >
                <option value={10}>10 XP</option>
                <option value={25}>25 XP</option>
                <option value={50}>50 XP</option>
                <option value={100}>100 XP</option>
              </select>
              <button
                type="submit"
                disabled={!newTodoText.trim()}
                className="text-secondary hover:text-primary disabled:opacity-40 pb-1"
              >
                <Plus size={16} />
              </button>
            </form>

            {/* Todo List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {todos.length === 0 && (
                <div className="text-center text-secondary text-[10px] uppercase tracking-widest font-[family-name:var(--font-primary)] mt-10">
                  No tasks yet.
                </div>
              )}
              {todos.map(todo => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  onToggle={() => toggleTodo(todo.id)}
                  onDelete={() => deleteTodo(todo.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'xp' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="font-[family-name:var(--font-primary)] text-[10px] uppercase tracking-widest font-bold text-secondary">
              Daily Goal Progress
            </div>

            {/* Vertical progress bar */}
            <div className="w-14 h-56 bg-surface border-[length:var(--border-weight)] border-border relative overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 bg-primary transition-all duration-700 ease-out"
                style={{ height: `${xpPercentage}%` }}
              />
            </div>

            <div className="font-[family-name:var(--font-primary)] text-2xl font-black text-foreground text-center">
              {dailyGained}
              <span className="text-sm text-secondary block">/ {dailyGoal} XP</span>
            </div>

            <div className="text-center">
              <div className="font-[family-name:var(--font-primary)] text-[10px] text-secondary uppercase tracking-widest">
                Tasks completed
              </div>
              <div className="font-[family-name:var(--font-primary)] text-lg font-black text-primary">
                {completionRate}%
              </div>
            </div>

            {xpPercentage >= 100 && (
              <div className="text-xs font-bold text-primary uppercase font-[family-name:var(--font-primary)] tracking-widest animate-pulse">
                🎉 Goal Reached!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pomodoro + Clock — pinned bottom */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
        <LiveClock />
        <GlobalPomodoro />
      </div>
    </div>
  );
}
