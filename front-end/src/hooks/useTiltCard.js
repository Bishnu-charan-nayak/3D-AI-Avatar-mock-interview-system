/**
 * useTiltCard — 3D perspective tilt on hover
 * Calculates rotation from mouse position relative to element center.
 * Uses only transform for GPU-accelerated 60fps.
 */
import { useEffect } from 'react';
import { gsap } from 'gsap';

/**
 * @param {React.RefObject} ref - Card element ref
 * @param {number} [maxTilt=12] - Maximum tilt in degrees
 */
export default function useTiltCard(ref, maxTilt = 12) {
  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -maxTilt;
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * maxTilt;

      gsap.to(el, {
        rotateX,
        rotateY,
        transformPerspective: 800,
        duration: 0.4,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.5)',
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, maxTilt]);
}
