/**
 * Application configuration
 * Environment variables can be set in .env file
 */

/**
 * Background image URL for the app
 * @default Unsplash stadium image
 */
export const BG_IMAGE_URL =
  import.meta.env.VITE_BG_IMAGE_URL ||
  'https://images.unsplash.com/photo-1614850523011-8f49ffc73908?fm=jpg&q=60&w=3000';

/**
 * Fallback player image URL
 * @default Silhouette image
 */
export const FALLBACK_IMAGE_URL =
  import.meta.env.VITE_FALLBACK_IMAGE_URL ||
  'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?fm=jpg&q=60&w=800';

/**
 * Fallback background image (secondary)
 * @default Chelsea FC background
 */
export const FALLBACK_BG_IMAGE_URL =
  import.meta.env.VITE_FALLBACK_BG_IMAGE_URL ||
  'https://www.thesun.co.uk/wp-content/uploads/2023/05/CHELSEA_BG_v1.jpg';

/**
 * Image transition duration in milliseconds
 * @default 500ms
 */
export const TRANSITION_DURATION = Number.parseInt(
  import.meta.env.VITE_TRANSITION_DURATION || '500',
  10
);

/**
 * Enable/disable keyboard navigation
 * @default true
 */
export const KEYBOARD_NAVIGATION_ENABLED =
  import.meta.env.VITE_KEYBOARD_NAVIGATION_ENABLED !== 'false';

/**
 * Preload all images on mount
 * @default true
 */
export const PRELOAD_ALL_IMAGES =
  import.meta.env.VITE_PRELOAD_ALL_IMAGES !== 'false';

/**
 * Maximum image preload retries
 * @default 3
 */
export const MAX_IMAGE_RETRIES = Number.parseInt(
  import.meta.env.VITE_MAX_IMAGE_RETRIES || '3',
  10
);

/**
 * Image retry delay in milliseconds
 * @default 1000ms
 */
export const IMAGE_RETRY_DELAY = Number.parseInt(
  import.meta.env.VITE_IMAGE_RETRY_DELAY || '1000',
  10
);

/**
 * Credit link URL
 */
export const CREDIT_URL = 'https://www.facebook.com/hung.041203';

/**
 * Credit text
 */
export const CREDIT_TEXT = 'Credit: Lâm Tiên Hưng';

/**
 * App title
 */
export const APP_TITLE = 'Chelsea FC Player Showcase — Squad, Numbers & Profiles';

/**
 * App description
 */
export const APP_DESCRIPTION =
  'Browse the full Chelsea FC squad in an interactive player showcase. View shirt numbers, positions, nationalities, and the captain in individual, grid, or formation view.';

/**
 * Canonical site name, used for og:site_name and structured data.
 */
export const SITE_NAME = 'Chelsea FC Player Showcase';

/**
 * Canonical production URL (no trailing slash), used to build absolute URLs
 * for canonical links, sitemap.xml, robots.txt, and social meta tags.
 * @default placeholder — set VITE_SITE_URL once the site has a real domain
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://chelsea-showcase.example.com'
).replace(/\/$/, '');

/**
 * Absolute URL of the default social share image (og:image / twitter:image).
 */
export const OG_IMAGE_URL = `${SITE_URL}/logo.png`;
