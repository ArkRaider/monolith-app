/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

interface CustomCursorProps {
  theme: string;
}

export default function CustomCursor({ theme }: CustomCursorProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Detect mobile touch devices to safely disable custom cursor follower
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      || (window.matchMedia("(any-hover: none)").matches);
    
    setIsMobile(isMobileDevice);
    if (isMobileDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (isHidden) setIsHidden(false);
    };

    const handleMouseLeave = () => {
      setIsHidden(true);
    };

    const handleMouseEnter = () => {
      setIsHidden(false);
    };

    const handleMouseOver = (e: MouseEvent) => {
      // Find out if hovering interactive item
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isClickable = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        target.closest('[role="button"]') !== null ||
        target.classList.contains('cursor-pointer') ||
        window.getComputedStyle(target).cursor === 'pointer';

      setIsHovered(!!isClickable);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isHidden]);

  if (isMobile || isHidden) return null;

  const isDark = theme === 'dark-void' || theme === 'dark' || (theme?.includes('dark') ?? false);

  return (
    <>
      {/* Central exact point dot */}
      <div
        id="cursor-dot"
        className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '6px',
          height: '6px',
          backgroundColor: isDark ? '#FFFFFF' : '#000000',
        }}
      />
      {/* Outer focus halo/ring which expands on hover */}
      <div
        id="cursor-ring"
        className="fixed pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ease-out"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: isHovered ? '40px' : '20px',
          height: isHovered ? '40px' : '20px',
          border: `1px solid ${
            isDark 
              ? isHovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.25)' 
              : isHovered ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.25)'
          }`,
          backgroundColor: isHovered 
            ? isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' 
            : 'transparent',
        }}
      />
    </>
  );
}
