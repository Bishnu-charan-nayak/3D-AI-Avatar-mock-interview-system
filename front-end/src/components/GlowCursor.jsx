/**
 * GlowCursor — Custom glowing cursor with GSAP quickTo for smooth lag
 * Scales up on interactive elements. Hidden on touch devices.
 */
import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap';

export default function GlowCursor() {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!hasFinePointer) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    const handleMouseMove = (e) => {
      gsap.set(cursor, { x: e.clientX - 6, y: e.clientY - 6 });
      gsap.to(follower, { x: e.clientX - 20, y: e.clientY - 20, duration: 0.5, ease: 'power3.out' });
    };

    const handleEnterInteractive = () => {
      gsap.to(cursor, { scale: 2.5, opacity: 0.6, duration: 0.3 });
      gsap.to(follower, { scale: 1.6, opacity: 0.3, duration: 0.3 });
    };

    const handleLeaveInteractive = () => {
      gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3 });
      gsap.to(follower, { scale: 1, opacity: 0.5, duration: 0.3 });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Add hover detection for interactive elements
    const interactives = document.querySelectorAll('a, button, input, textarea, select, [data-magnetic]');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', handleEnterInteractive);
      el.addEventListener('mouseleave', handleLeaveInteractive);
    });

    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', handleEnterInteractive);
        el.removeEventListener('mouseleave', handleLeaveInteractive);
      });
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="glow-cursor" />
      <div ref={followerRef} className="glow-cursor-follower" />
    </>
  );
}
