/**
 * ParticleField — CSS-only floating particle background
 * ~20 glowing dots with CSS animations at different speeds/sizes for parallax depth.
 * Zero JS overhead — pure CSS animation.
 */
import React from 'react';

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 8,
  duration: Math.random() * 12 + 10,
  maxOpacity: Math.random() * 0.5 + 0.2,
}));

export default function ParticleField() {
  return (
    <div className="particle-field" aria-hidden="true">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            '--particle-opacity': p.maxOpacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
