/**
 * Tests for navigation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getNextIndex,
  canNavigateAction,
  getNavigationBlockReason,
  createInitialState,
  type NavigationDirection,
  type NavigationState,
  KEYBOARD_DIRECTION_MAP,
  isValidNavigationKey,
  getDirectionFromKeyboard,
} from './navigation';

describe('getNextIndex', () => {
  const totalPlayers = 26;

  it('should return next index', () => {
    expect(getNextIndex(0, totalPlayers, 'next')).toBe(1);
    expect(getNextIndex(5, totalPlayers, 'next')).toBe(6);
  });

  it('should return previous index', () => {
    expect(getNextIndex(1, totalPlayers, 'prev')).toBe(0);
    expect(getNextIndex(5, totalPlayers, 'prev')).toBe(4);
  });

  it('should wrap around from end to start', () => {
    expect(getNextIndex(25, totalPlayers, 'next')).toBe(0);
  });

  it('should wrap around from start to end', () => {
    expect(getNextIndex(0, totalPlayers, 'prev')).toBe(25);
  });

  it('should default to next direction', () => {
    expect(getNextIndex(5, totalPlayers)).toBe(6);
  });
});

describe('canNavigateAction', () => {
  it('should return true when navigation is allowed', () => {
    const state: NavigationState = {
      currentIndex: 0,
      canNavigate: true,
      imageLoaded: true,
      isLoading: false,
    };
    expect(canNavigateAction(state)).toBe(true);
  });

  it('should return false when canNavigate is false', () => {
    const state: NavigationState = {
      currentIndex: 0,
      canNavigate: false,
      imageLoaded: true,
      isLoading: false,
    };
    expect(canNavigateAction(state)).toBe(false);
  });

  it('should return false when imageLoaded is false', () => {
    const state: NavigationState = {
      currentIndex: 0,
      canNavigate: true,
      imageLoaded: false,
      isLoading: false,
    };
    expect(canNavigateAction(state)).toBe(false);
  });

  it('should return false when both conditions are false', () => {
    const state: NavigationState = {
      currentIndex: 0,
      canNavigate: false,
      imageLoaded: false,
      isLoading: false,
    };
    expect(canNavigateAction(state)).toBe(false);
  });
});

describe('getNavigationBlockReason', () => {
  it('should return null when navigation is allowed', () => {
    const state: NavigationState = {
      currentIndex: 0,
      canNavigate: true,
      imageLoaded: true,
      isLoading: false,
    };
    expect(getNavigationBlockReason(state)).toBeNull();
  });

  it('should return reason when canNavigate is false', () => {
    const state: NavigationState = {
      currentIndex: 0,
      canNavigate: false,
      imageLoaded: true,
      isLoading: false,
    };
    expect(getNavigationBlockReason(state)).toBe('Navigation is currently disabled');
  });

  it('should return reason when imageLoaded is false', () => {
    const state: NavigationState = {
      currentIndex: 0,
      canNavigate: true,
      imageLoaded: false,
      isLoading: false,
    };
    expect(getNavigationBlockReason(state)).toBe('Image is still loading');
  });
});

describe('createInitialState', () => {
  it('should create initial navigation state', () => {
    const state = createInitialState();

    expect(state.currentIndex).toBe(0);
    expect(state.canNavigate).toBe(true);
    expect(state.imageLoaded).toBe(false);
    expect(state.isLoading).toBe(true);
  });
});

describe('KEYBOARD_DIRECTION_MAP', () => {
  it('should map arrow keys to directions', () => {
    expect(KEYBOARD_DIRECTION_MAP.ArrowRight).toBe('next');
    expect(KEYBOARD_DIRECTION_MAP.ArrowLeft).toBe('prev');
    expect(KEYBOARD_DIRECTION_MAP.ArrowUp).toBe('prev');
    expect(KEYBOARD_DIRECTION_MAP.ArrowDown).toBe('next');
  });
});

describe('isValidNavigationKey', () => {
  it('should return true for valid navigation keys', () => {
    expect(isValidNavigationKey({ key: 'ArrowRight' } as KeyboardEvent)).toBe(true);
    expect(isValidNavigationKey({ key: 'ArrowLeft' } as KeyboardEvent)).toBe(true);
    expect(isValidNavigationKey({ key: 'ArrowUp' } as KeyboardEvent)).toBe(true);
    expect(isValidNavigationKey({ key: 'ArrowDown' } as KeyboardEvent)).toBe(true);
  });

  it('should return false for invalid keys', () => {
    expect(isValidNavigationKey({ key: 'Enter' } as KeyboardEvent)).toBe(false);
    expect(isValidNavigationKey({ key: 'Escape' } as KeyboardEvent)).toBe(false);
    expect(isValidNavigationKey({ key: 'a' } as KeyboardEvent)).toBe(false);
  });
});

describe('getDirectionFromKeyboard', () => {
  it('should return correct direction for arrow keys', () => {
    expect(getDirectionFromKeyboard({ key: 'ArrowRight' } as KeyboardEvent)).toBe('next');
    expect(getDirectionFromKeyboard({ key: 'ArrowLeft' } as KeyboardEvent)).toBe('prev');
    expect(getDirectionFromKeyboard({ key: 'ArrowUp' } as KeyboardEvent)).toBe('prev');
    expect(getDirectionFromKeyboard({ key: 'ArrowDown' } as KeyboardEvent)).toBe('next');
  });

  it('should return null for invalid keys', () => {
    expect(getDirectionFromKeyboard({ key: 'Enter' } as KeyboardEvent)).toBeNull();
    expect(getDirectionFromKeyboard({ key: ' ' } as KeyboardEvent)).toBeNull();
  });
});
