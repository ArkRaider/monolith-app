import React from 'react';

export default function DroneVisualizer({ isActive, isDark }: { isActive: boolean, isDark: boolean }) {
  if (!isActive) {
    return (
      <div className="flex items-center gap-[2px] h-3.5 w-3.5 opacity-50">
        <div className={`w-[2px] h-1 rounded-full ${isDark ? 'bg-black' : 'bg-white'}`} />
        <div className={`w-[2px] h-1 rounded-full ${isDark ? 'bg-black' : 'bg-white'}`} />
        <div className={`w-[2px] h-1 rounded-full ${isDark ? 'bg-black' : 'bg-white'}`} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[2px] h-3.5 w-3.5">
      <div className={`w-[2px] rounded-full animate-[pulse-height_1s_ease-in-out_infinite_alternate] ${isDark ? 'bg-black' : 'bg-white'}`} style={{ height: '40%', animationDelay: '0s' }} />
      <div className={`w-[2px] rounded-full animate-[pulse-height_1s_ease-in-out_infinite_alternate] ${isDark ? 'bg-black' : 'bg-white'}`} style={{ height: '100%', animationDelay: '0.3s' }} />
      <div className={`w-[2px] rounded-full animate-[pulse-height_1s_ease-in-out_infinite_alternate] ${isDark ? 'bg-black' : 'bg-white'}`} style={{ height: '60%', animationDelay: '0.6s' }} />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-height {
          0% { height: 20%; opacity: 0.5; }
          100% { height: 100%; opacity: 1; }
        }
      `}} />
    </div>
  );
}
