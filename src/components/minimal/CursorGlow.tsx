'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CursorGlow() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(59,130,246,0.2) 40%, rgba(0,0,0,0) 70%)',
        }}
        animate={{
          x: mousePosition.x - 400,
          y: mousePosition.y - 400,
        }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 1 }}
      />
    </motion.div>
  );
}
