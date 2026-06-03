import React from 'react';

export function PodGlassFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full relative overflow-hidden bg-black border-[length:var(--border-weight)] border-border rounded-[2rem] group shadow-[var(--ui-shadow)] flex items-center justify-center">
      {/* Visual Glass Overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-[2rem] border border-white/5 bg-gradient-to-b from-white/5 to-transparent mix-blend-overlay z-20" />
      
      {children}
    </div>
  );
}
