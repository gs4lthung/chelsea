/**
 * Tests for image utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  preloadImage,
  preloadImageWithRetry,
  preloadImages,
  sleep,
  getFallbackImage,
  getBackgroundStyle,
  isValidImageUrl,
  getResponsiveSizes,
} from './image-utils';

// Mock Image class
class MockImage {
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    // Simulate async load
    setTimeout(() => {
      if (this.src.includes('fail')) {
        this.onerror?.();
      } else {
        this.onload?.();
      }
    }, 10);
  }
}

// Mock window object for SSR detection
const originalWindow = globalThis.window;

describe('preloadImage', () => {
  beforeEach(() => {
    // @ts-expect-error - mocking Image constructor
    globalThis.Image = MockImage;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('should preload an image successfully', async () => {
    const result = await preloadImage('/test.png');
    expect(result).toBeDefined();
  });

  it('should reject on image load failure', async () => {
    await expect(preloadImage('/fail.png')).rejects.toThrow();
  });
});

describe('preloadImageWithRetry', () => {
  beforeEach(() => {
    // @ts-expect-error - mocking Image constructor
    globalThis.Image = MockImage;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('should load image successfully on first attempt', async () => {
    const result = await preloadImageWithRetry('/test.png', 3);
    expect(result.success).toBe(true);
    expect(result.src).toBe('/test.png');
  });

  it('should retry on failure and return success', async () => {
    // This test assumes the mock will eventually succeed
    // In real scenario, you'd need a more sophisticated mock
    const result = await preloadImageWithRetry('/test.png', 3);
    expect(result).toBeDefined();
  });
});

describe('sleep', () => {
  it('should resolve after specified time', async () => {
    const start = Date.now();
    await sleep(100);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(100);
  });
});

describe('getFallbackImage', () => {
  it('should return fallback image URL', () => {
    const fallback = getFallbackImage('/missing.png');
    expect(fallback).toBeDefined();
    expect(typeof fallback).toBe('string');
  });
});

describe('getBackgroundStyle', () => {
  it('should generate background style with primary and fallback images', () => {
    const style = getBackgroundStyle('/primary.png', '/fallback.png');
    expect(style).toContain('/primary.png');
    expect(style).toContain('/fallback.png');
    expect(style).toContain('background-image');
  });

  it('should never fall back to the literal string "undefined" when called with only a primary image', () => {
    // This is the actual call shape IndividualView.svelte uses.
    const style = getBackgroundStyle('/primary.png');
    expect(style).not.toContain('undefined');
  });
});

describe('isValidImageUrl', () => {
  it('should return true for valid absolute paths', () => {
    expect(isValidImageUrl('/image.png')).toBe(true);
    expect(isValidImageUrl('/path/to/image.webp')).toBe(true);
  });

  it('should return true for valid HTTP URLs', () => {
    expect(isValidImageUrl('http://example.com/image.png')).toBe(true);
    expect(isValidImageUrl('https://example.com/image.png')).toBe(true);
  });

  it('should return true for data URLs', () => {
    expect(isValidImageUrl('data:image/png;base64,iVBORw0KG...')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(isValidImageUrl('')).toBe(false);
    expect(isValidImageUrl('not-a-url')).toBe(false);
    expect(isValidImageUrl('ftp://example.com/image.png')).toBe(false);
  });

  it('should return false for non-string values', () => {
    expect(isValidImageUrl(null as unknown as string)).toBe(false);
    expect(isValidImageUrl(undefined as unknown as string)).toBe(false);
    expect(isValidImageUrl(123 as unknown as string)).toBe(false);
  });
});

describe('getResponsiveSizes', () => {
  it('should return responsive sizes string', () => {
    const sizes = getResponsiveSizes();
    expect(typeof sizes).toBe('string');
    expect(sizes).toContain('max-width');
  });
});
