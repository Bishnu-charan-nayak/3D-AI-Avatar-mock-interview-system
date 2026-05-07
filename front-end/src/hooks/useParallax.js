/**
 * useParallax — Scroll-driven parallax depth effect
 * Moves element at a different rate than scroll to create depth layering.
 */
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * @param {React.RefObject} ref - Target element
 * @param {number} speed - Parallax multiplier (negative = opposite direction)
 */
export default function useParallax(ref, speed = -50) {
  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        y: speed,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [ref, speed]);
}
