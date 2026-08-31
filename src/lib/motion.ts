/**
 * GSAP-powered Svelte transitions.
 *
 * Svelte still owns the enter/exit lifecycle (mount/destroy timing, {#key}
 * remounts, out-transition promises) — these plug into that via the
 * standard `css(t, u)` transition contract, but the actual motion curve and
 * per-frame values are computed by GSAP (its eases, `gsap.utils.interpolate`).
 */

import gsap from 'gsap';
import type { TransitionConfig } from 'svelte/transition';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface FlyOptions {
  x?: number;
  y?: number;
  duration?: number;
  delay?: number;
  ease?: string;
}

/** Slide + fade. Used for the player card and squad grid entries. */
export function gsapFly(node: Element, options: FlyOptions = {}): TransitionConfig {
  const { x = 0, y = 0, duration = 450, delay = 0, ease = 'power3.out' } = options;
  if (prefersReducedMotion()) return { duration: 0 };

  const easeFn = gsap.parseEase(ease);
  return {
    delay,
    duration,
    css: (t: number) => {
      const eased = easeFn(t);
      const dx = gsap.utils.interpolate(x, 0, eased);
      const dy = gsap.utils.interpolate(y, 0, eased);
      return `transform: translate(${dx}px, ${dy}px); opacity: ${eased};`;
    },
  };
}

interface FadeOptions {
  duration?: number;
  delay?: number;
  ease?: string;
}

/** Plain fade, eased by GSAP. Used for view-mode switches and the pitch. */
export function gsapFade(node: Element, options: FadeOptions = {}): TransitionConfig {
  const { duration = 380, delay = 0, ease = 'power2.out' } = options;
  if (prefersReducedMotion()) return { duration: 0 };

  const easeFn = gsap.parseEase(ease);
  return {
    delay,
    duration,
    css: (t: number) => `opacity: ${easeFn(t)};`,
  };
}

interface CardInOptions {
  x?: number;
  duration?: number;
  delay?: number;
  ease?: string;
}

/**
 * Player card entrance: slides in the given direction while scaling up
 * from slightly-small to full size, with a small overshoot at the end
 * (via a `back.out` ease) — reads like a card being dealt into place
 * rather than a flat slide.
 */
export function gsapCardIn(node: Element, options: CardInOptions = {}): TransitionConfig {
  const { x = 0, duration = 620, delay = 0, ease = 'back.out(1.5)' } = options;
  if (prefersReducedMotion()) return { duration: 0 };

  const easeFn = gsap.parseEase(ease);
  return {
    delay,
    duration,
    css: (t: number) => {
      const eased = easeFn(t);
      const clamped = gsap.utils.clamp(0, 1, eased);
      const dx = gsap.utils.interpolate(x, 0, eased);
      const scale = gsap.utils.interpolate(0.85, 1, eased);
      return `transform: translateX(${dx}px) scale(${scale}); opacity: ${clamped};`;
    },
  };
}

interface PopOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  start?: number;
}

/** Scale + fade "pop" — used for the formation pitch dots. */
export function gsapPop(node: Element, options: PopOptions = {}): TransitionConfig {
  const { duration = 420, delay = 0, ease = 'back.out(1.7)', start = 0.5 } = options;
  if (prefersReducedMotion()) return { duration: 0 };

  const easeFn = gsap.parseEase(ease);
  return {
    delay,
    duration,
    css: (t: number) => {
      const eased = easeFn(t);
      const scale = gsap.utils.interpolate(start, 1, eased);
      return `transform: scale(${scale}); opacity: ${gsap.utils.clamp(0, 1, eased)};`;
    },
  };
}
