'use client';

import * as React from 'react';
import { CheckSquare } from 'lucide-react';

export function TaskWidget({ minimized }: { minimized?: boolean }) {
  const [todos, setTodos] = React.useState<{ id: string, text: string, done: boolean }[]>([]);
  const [todoInput, setTodoInput] = React.useState('');

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoInput.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: todoInput.trim(), done: false }]);
    setTodoInput('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  if (minimized) {
    const pending = todos.filter(t => !t.done).length;
    return (
      <div className="flex items-center gap-2 px-2">
        <CheckSquare className="w-4 h-4 text-primary shrink-0" />
        <span className="font-bold text-sm text-foreground font-[family-name:var(--font-primary)]">
          {pending} task{pending !== 1 ? 's' : ''} left
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-[250px] w-full h-full">
      <div className="flex items-center gap-2 mb-2 shrink-0 justify-center">
        <CheckSquare className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground font-[family-name:var(--font-primary)] uppercase tracking-widest">Tasks</h3>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-2">
        {todos.map(todo => (
          <div key={todo.id} className="flex items-start gap-3 group">
            <input 
              type="checkbox" 
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
              className="mt-1 accent-primary w-4 h-4 cursor-pointer"
            />
            <span className={`text-sm ${todo.done ? 'line-through text-white/50' : 'text-foreground'} font-[family-name:var(--font-primary)]`}>
              {todo.text}
            </span>
          </div>
        ))}
        {todos.length === 0 && (
          <div className="text-xs text-white/50 italic text-center py-4 my-auto">No tasks yet. Stay focused!</div>
        )}
      </div>
      <form onSubmit={addTodo} className="mt-auto shrink-0 pt-4 border-t border-white/10">
        <input 
          type="text" 
          value={todoInput}
          onChange={(e) => setTodoInput(e.target.value)}
          placeholder="Add a task..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-[family-name:var(--font-primary)] text-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </form>
    </div>
  );
}
