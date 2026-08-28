/**
 * Navigation utilities for player showcase
 */

import type { Player } from './players';

export type NavigationDirection = 'next' | 'prev';

/**
 * Calculate next index with wraparound
 */
export function getNextIndex(
  currentIndex: number,
  totalPlayers: number,
  direction: NavigationDirection = 'next'
): number {
  const offset = direction === 'next' ? 1 : -1;
  return (currentIndex + offset + totalPlayers) % totalPlayers;
}

/**
 * Navigation state interface
 */
export interface NavigationState {
  currentIndex: number;
  canNavigate: boolean;
  imageLoaded: boolean;
  isLoading: boolean;
}

/**
 * Navigation action result
 */
export interface NavigationAction {
  success: boolean;
  newIndex?: number;
  error?: string;
}

/**
 * Validate if navigation is allowed
 */
export function canNavigateAction(state: NavigationState): boolean {
  return state.canNavigate && state.imageLoaded;
}

/**
 * Get error message if navigation is not allowed
 */
export function getNavigationBlockReason(state: NavigationState): string | null {
  if (!state.canNavigate) {
    return 'Navigation is currently disabled';
  }
  if (!state.imageLoaded) {
    return 'Image is still loading';
  }
  return null;
}

/**
 * Create initial navigation state
 */
export function createInitialState(): NavigationState {
  return {
    currentIndex: 0,
    canNavigate: true,
    imageLoaded: false,
    isLoading: true,
  };
}

/**
 * Debounce function to prevent rapid navigation clicks
 */
export function createDebouncedNavigation(
  action: () => Promise<void>,
  delay: number = 300
): () => Promise<void> {
  let isRunning = false;

  return async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;
    try {
      await action();
    } finally {
      setTimeout(() => {
        isRunning = false;
      }, delay);
    }
  };
}

/**
 * Keyboard key to direction mapping
 */
export const KEYBOARD_DIRECTION_MAP: Record<string, NavigationDirection> = {
  ArrowRight: 'next',
  ArrowLeft: 'prev',
  ArrowUp: 'prev',
  ArrowDown: 'next',
};

/**
 * Check if a keyboard event should trigger navigation
 */
export function isValidNavigationKey(event: KeyboardEvent): boolean {
  return event.key in KEYBOARD_DIRECTION_MAP;
}

/**
 * Get navigation direction from keyboard event
 */
export function getDirectionFromKeyboard(event: KeyboardEvent): NavigationDirection | null {
  return KEYBOARD_DIRECTION_MAP[event.key] || null;
}
