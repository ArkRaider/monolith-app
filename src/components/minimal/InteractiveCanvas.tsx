import React, { useEffect, useState } from 'react';

interface InteractiveCanvasProps {
  theme: string;
}

export default function InteractiveCanvas({ theme }: InteractiveCanvasProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: isDark 
            ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)' 
            : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.2) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Magnetic Glow Tracker */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: isDark
            ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`
            : `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0,0,0,0.04), transparent 40%)`,
        }}
      />
    </div>
  );
}
