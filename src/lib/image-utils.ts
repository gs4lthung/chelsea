/**
 * Image loading utilities with error handling and retry logic
 */

import {
  FALLBACK_IMAGE_URL,
  FALLBACK_BG_IMAGE_URL,
  MAX_IMAGE_RETRIES,
  IMAGE_RETRY_DELAY,
} from './config';

export interface ImageLoadResult {
  success: boolean;
  src: string;
  error?: Error;
}

/**
 * Preload a single image without artificial delay
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      // SSR: resolve immediately with a fake image element
      resolve({} as HTMLImageElement);
      return;
    }

    const img = new Image();
    img.src = src;

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
  });
}

/**
 * Preload an image with retry logic
 */
export async function preloadImageWithRetry(
  src: string,
  maxRetries: number = MAX_IMAGE_RETRIES
): Promise<ImageLoadResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await preloadImage(src);
      return { success: true, src };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) {
        console.error(`Failed to load image after ${maxRetries} attempts:`, src);
        return {
          success: false,
          src,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
      // Wait before retrying
      await sleep(IMAGE_RETRY_DELAY);
    }
  }
  return { success: false, src, error: new Error('Max retries exceeded') };
}

/**
 * Preload multiple images in parallel
 */
export async function preloadImages(srcs: string[]): Promise<ImageLoadResult[]> {
  if (typeof window === 'undefined') {
    return srcs.map((src) => ({ success: true, src }));
  }

  const results = await Promise.allSettled(
    srcs.map((src) => preloadImageWithRetry(src))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return { success: false, src: srcs[index], error: new Error(String(result.reason)) };
  });
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get fallback image for a player
 */
export function getFallbackImage(originalSrc: string): string {
  return FALLBACK_IMAGE_URL;
}

/**
 * Generate background style with fallback
 */
export function getBackgroundStyle(
  primaryImage: string,
  fallbackImage?: string
): string {
  const bg = fallbackImage || FALLBACK_BG_IMAGE_URL;
  return `background-image: url('${primaryImage}'), url('${bg}')`;
}

/**
 * Check if an image URL is valid (basic format check)
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  // Check for common image protocols and extensions
  return (
    url.startsWith('/') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:image/')
  );
}

/**
 * Get responsive image srcset for player images
 */
export function getResponsiveSrcset(baseUrl: string): string {
  // Assuming static images at different sizes
  const sizes = [300, 600, 800, 1200];
  return sizes
    .map((size) => {
      // If it's a local static image, we can generate sized versions
      if (baseUrl.startsWith('/')) {
        const ext = baseUrl.split('.').pop();
        const name = baseUrl.replace(/\.[^.]*$/, '');
        return `${name}_${size}.${ext} ${size}w`;
      }
      return `${baseUrl} ${size}w`;
    })
    .join(', ');
}

/**
 * Get sizes attribute for responsive images
 */
export function getResponsiveSizes(): string {
  return '(max-width: 350px) 300px, (max-width: 600px) 600px, 800px';
}

/**
 * Convert image to WebP format URL (placeholder for future implementation)
 */
export function getWebPUrl(originalUrl: string): string {
  // This is a placeholder for future WebP conversion
  // Could be implemented with a build step or CDN transformation
  return originalUrl;
}

/**
 * Read a small icon-sized image (e.g. a custom country flag) and return it
 * as a resized data URL. No cropping — flags are already tightly framed.
 */
export function readIconFileAsDataUrl(file: File, maxDimension = 64): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the selected file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode the selected image'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas is not supported in this browser'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
