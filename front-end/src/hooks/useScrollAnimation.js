/**
 * useScrollAnimation — Reusable scroll-triggered GSAP animations
 * Supports fade, scale, slide, and staggered child animations.
 * Only animates transform + opacity for 60fps.
 */
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PRESETS = {
  fadeUp: { y: 60, opacity: 0 },
  fadeIn: { opacity: 0 },
  scaleIn: { scale: 0.85, opacity: 0 },
  slideLeft: { x: -80, opacity: 0 },
  slideRight: { x: 80, opacity: 0 },
};

/**
 * @param {React.RefObject} ref - Element or container ref
 * @param {Object} config
 * @param {string} config.type - Animation preset name
 * @param {boolean} [config.scrub] - Scrub with scroll position
 * @param {number} [config.delay] - Delay in seconds
 * @param {number} [config.duration] - Duration in seconds
 * @param {string} [config.staggerChildren] - CSS selector for staggered children
 * @param {number} [config.stagger] - Stagger delay between children
 * @param {string} [config.start] - ScrollTrigger start position
 * @param {string} [config.end] - ScrollTrigger end position
 */
export default function useScrollAnimation(ref, config = {}) {
  const {
    type = 'fadeUp',
    scrub = false,
    delay = 0,
    duration = 1,
    staggerChildren = null,
    stagger = 0.15,
    start = 'top 85%',
    end = 'top 20%',
  } = config;

  useEffect(() => {
    if (!ref.current) return;

    const from = PRESETS[type] || PRESETS.fadeUp;
    const targets = staggerChildren
      ? ref.current.querySelectorAll(staggerChildren)
      : ref.current;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        ...from,
        delay,
        duration,
        stagger: staggerChildren ? stagger : 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start,
          end,
          scrub: scrub ? 1 : false,
          toggleActions: scrub ? undefined : 'play none none reverse',
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [ref, type, scrub, delay, duration, staggerChildren, stagger, start, end]);
}
