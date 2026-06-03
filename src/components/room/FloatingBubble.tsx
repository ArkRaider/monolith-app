'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo, useMotionValue } from 'framer-motion';
import { Lock, Unlock, Minus, Maximize2, Pin, PinOff } from 'lucide-react';

interface WidgetState {
  x: number;
  y: number;
  width?: number;
  height?: number;
  minimized: boolean;
  isLocked: boolean;
}

interface FloatingBubbleProps {
  id: string;
  initialX?: number;
  initialY?: number;
  constraintsRef?: React.RefObject<HTMLDivElement | null>;
  children: (props: { minimized: boolean }) => React.ReactNode;
  
  // Optional external control
  forceMinimized?: boolean;
  onMinimizeToggle?: (minimized: boolean) => void;
  hideHeader?: boolean;
  isFab?: boolean; // For tiny circular buttons like Background

  // Pinning logic
  isPinned?: boolean;
  onPinToggle?: () => void;
  pinnedX?: number;
  pinnedY?: number;
}

export function FloatingBubble({
  id,
  initialX = 0,
  initialY = 0,
  constraintsRef,
  children,
  forceMinimized,
  onMinimizeToggle,
  hideHeader = false,
  isFab = false,
  isPinned = false,
  onPinToggle,
  pinnedX = 0,
  pinnedY = 0
}: FloatingBubbleProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState<{ width: number | 'auto'; height: number | 'auto' }>({ width: 'auto', height: 'auto' });
  const [minimized, setMinimized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [windowBounds, setWindowBounds] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    setWindowBounds({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowBounds({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);

    const saved = localStorage.getItem(`widget_v2_${id}`);
    if (saved) {
      try {
        const parsed: WidgetState = JSON.parse(saved);
        setPosition({ x: parsed.x ?? initialX, y: parsed.y ?? initialY });
        setSize({ width: parsed.width || 'auto', height: parsed.height || 'auto' });
        setMinimized(parsed.minimized ?? false);
        setIsLocked(parsed.isLocked ?? false);
      } catch (e) {
        console.warn('Failed to parse widget state for', id);
      }
    }
    setIsMounted(true);

    return () => window.removeEventListener('resize', handleResize);
  }, [id, initialX, initialY]);

  useEffect(() => {
    if (forceMinimized !== undefined) {
      setMinimized(forceMinimized);
    }
  }, [forceMinimized]);

  const saveState = (newState: Partial<WidgetState>) => {
    const current = { 
      x: position.x, 
      y: position.y, 
      width: size.width === 'auto' ? undefined : size.width, 
      height: size.height === 'auto' ? undefined : size.height, 
      minimized, 
      isLocked, 
      ...newState 
    };
    localStorage.setItem(`widget_v2_${id}`, JSON.stringify(current));
  };

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isPinned) return;
    const newX = position.x + x.get();
    const newY = position.y + y.get();
    
    x.set(0);
    y.set(0);
    
    setPosition({ x: newX, y: newY });
    saveState({ x: newX, y: newY });
  };

  const handleResizeStart = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      initialSizeRef.current = { width: rect.width, height: rect.height };
      setSize({ width: rect.width, height: rect.height });
    }
  };

  const handleResizeDrag = (e: any, info: PanInfo) => {
    setSize({
      width: Math.max(150, initialSizeRef.current.width + info.offset.x),
      height: Math.max(100, initialSizeRef.current.height + info.offset.y)
    });
  };

  const handleResizeEnd = () => {
    saveState({ 
      width: size.width === 'auto' ? undefined : size.width, 
      height: size.height === 'auto' ? undefined : size.height 
    });
  };

  const toggleMinimize = () => {
    const next = !minimized;
    setMinimized(next);
    saveState({ minimized: next });
    if (onMinimizeToggle) onMinimizeToggle(next);
  };

  const toggleLock = () => {
    const next = !isLocked;
    setIsLocked(next);
    saveState({ isLocked: next });
  };

  if (!isMounted) return null;

  const currentX = isPinned ? pinnedX : position.x;
  const currentY = isPinned ? pinnedY : position.y;

  return (
    <motion.div
      ref={containerRef}
      layout
      drag={!isLocked && !isPinned}
      dragConstraints={constraintsRef || { left: 0, right: windowBounds.width - 100, top: 0, bottom: windowBounds.height - 100 }}
      dragMomentum={false}
      dragElastic={0.1}
      style={{ 
        position: 'absolute', 
        width: minimized ? 'auto' : size.width,
        height: minimized ? 'auto' : size.height,
        zIndex: minimized ? 10 : (isPinned ? 30 : 20)
      }}
      animate={{ 
        left: currentX, 
        top: currentY,
        x: isPinned ? 0 : x.get(), 
        y: isPinned ? 0 : y.get() 
      }}
      onDragEnd={handleDragEnd}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
      className={`
        pointer-events-auto
        overflow-hidden text-foreground group
        ${minimized || size.width === 'auto' ? 'w-fit h-fit' : ''}
        ${isLocked || isPinned ? '' : 'cursor-grab active:cursor-grabbing'}
        ${isFab ? '' : 'rounded-3xl bg-black/20 backdrop-blur-2xl border border-white/10 shadow-lg flex flex-col'}
      `}
    >
      {!hideHeader && !isFab && (
        <div className="flex items-center justify-end px-3 py-2 gap-2 bg-transparent border-b border-white/5 opacity-50 hover:opacity-100 transition-opacity">
          {onPinToggle && (
            <button 
              onClick={onPinToggle} 
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
              title={isPinned ? "Unpin" : "Pin to corner"}
              onPointerDownCapture={(e) => e.stopPropagation()} 
            >
              {isPinned ? <PinOff size={12} className="text-primary" /> : <Pin size={12} />}
            </button>
          )}
          <button 
            onClick={toggleLock} 
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            title={isLocked ? "Unlock position" : "Lock position"}
            onPointerDownCapture={(e) => e.stopPropagation()} 
          >
            {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
          <button 
            onClick={toggleMinimize} 
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            title={minimized ? "Expand" : "Minimize"}
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            {minimized ? <Maximize2 size={12} /> : <Minus size={12} />}
          </button>
        </div>
      )}
      <div className={`${isFab ? "" : "p-4 flex-1 overflow-auto"} custom-scrollbar`} onPointerDownCapture={(e) => {
        // Allow clicks on inputs
      }}>
        {children({ minimized })}
      </div>

      {!minimized && !isLocked && !isPinned && !isFab && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onDragStart={handleResizeStart}
          onDrag={handleResizeDrag}
          onDragEnd={handleResizeEnd}
          onPointerDownCapture={(e) => e.stopPropagation()}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {/* Subtle resize dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-sm" />
        </motion.div>
      )}
    </motion.div>
  );
}
