/**
 * useMagneticButton — Mouse-proximity magnetic pull effect
 * Button subtly gravitates toward cursor when within range.
 */
import { useEffect } from 'react';
import { gsap } from 'gsap';

/**
 * @param {React.RefObject} ref - Button element ref
 * @param {number} [strength=0.35] - Pull strength (0-1)
 */
export default function useMagneticButton(ref, strength = 0.35) {
  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;

      gsap.to(el, {
        x,
        y,
        duration: 0.4,
        ease: 'power3.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.4)',
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, strength]);
}
