'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ClockWidget } from './widgets/ClockWidget';
import { PomodoroWidget } from './widgets/PomodoroWidget';
import { TaskWidget } from './widgets/TaskWidget';
import { BackgroundFAB } from './BackgroundFAB';
import { FloatingBubble } from './FloatingBubble';
import { AnimatePresence, motion } from 'framer-motion';

interface StudioCanvasProps {
  videoPod?: React.ReactNode;
  isVideoOff?: boolean;
  videoMinimized?: boolean;
  onVideoMinimizeToggle?: (val: boolean) => void;
}

export function StudioCanvas({ videoPod, isVideoOff, videoMinimized, onVideoMinimizeToggle }: StudioCanvasProps) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [videoPinned, setVideoPinned] = useState(false);
  const [windowBounds, setWindowBounds] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => setWindowBounds({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener('resize', handleResize);
    setIsMounted(true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMounted) return null;

  return (
    <div ref={constraintsRef} className="relative w-full h-full overflow-hidden pointer-events-none z-10">
      <FloatingBubble id="pomodoro" initialX={Math.max(windowBounds.width / 2 - 120, 250)} initialY={40} constraintsRef={constraintsRef}>
        {({ minimized }) => <PomodoroWidget minimized={minimized} />}
      </FloatingBubble>

      <FloatingBubble id="clock" initialX={Math.max(windowBounds.width - 250, 500)} initialY={40} constraintsRef={constraintsRef}>
        {({ minimized }) => <ClockWidget minimized={minimized} />}
      </FloatingBubble>

      <FloatingBubble id="task" initialX={40} initialY={40} constraintsRef={constraintsRef}>
        {({ minimized }) => <TaskWidget minimized={minimized} />}
      </FloatingBubble>

      <BackgroundFAB />

      <AnimatePresence>
        {!isVideoOff && videoPod && (
          <motion.div
            key="video-pod-wrapper"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-24 right-6 w-64 h-48 pointer-events-auto shadow-2xl rounded-[2rem] overflow-hidden z-40 border border-border"
          >
            {videoPod}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
