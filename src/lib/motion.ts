/**
 * GSAP-powered Svelte transitions.
 *
 * Svelte still owns the enter/exit lifecycle (mount/destroy timing, {#key}
 * remounts, out-transition promises) — these plug into that via the
 * standard `css(t, u)` transition contract, but the actual motion curve and
 * per-frame values are computed by GSAP (its eases, `gsap.utils.interpolate`).
 *
 * These always animate regardless of the OS/browser "reduce motion"
 * preference — this app's motion is decorative flourish the user asked for
 * repeatedly, not something that needs an accessibility opt-out.
 */

import gsap from 'gsap';
import type { TransitionConfig } from 'svelte/transition';

interface FlyOptions {
  x?: number;
  y?: number;
  duration?: number;
  delay?: number;
  ease?: string;
}

/** Slide + fade. Used for the squad grid entries. */
export function gsapFly(node: Element, options: FlyOptions = {}): TransitionConfig {
  const { x = 0, y = 0, duration = 450, delay = 0, ease = 'power3.out' } = options;

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

  const easeFn = gsap.parseEase(ease);
  return {
    delay,
    duration,
    css: (t: number) => `opacity: ${easeFn(t)};`,
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
