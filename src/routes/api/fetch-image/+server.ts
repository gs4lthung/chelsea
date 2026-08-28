import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { assertLocalRequest } from '$lib/server/local-guard';

const MAX_BYTES = 15 * 1024 * 1024; // 15MB
const FETCH_TIMEOUT_MS = 15_000;

/**
 * Proxies an external image URL through the server so the browser gets it
 * same-origin — a client-side fetch() of an arbitrary image host usually
 * fails CORS or taints the canvas, which breaks cropping/background removal.
 * Local-only: this makes an outbound request on the user's behalf, so it's
 * gated the same as the CRUD endpoints to avoid an open SSRF-style proxy.
 */
export const GET: RequestHandler = async (event) => {
  assertLocalRequest(event);

  const rawUrl = event.url.searchParams.get('url');
  if (!rawUrl) {
    throw error(400, 'Missing url parameter.');
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    throw error(400, 'That is not a valid URL.');
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw error(400, 'Only http and https URLs are supported.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(target, { signal: controller.signal });
  } catch {
    throw error(502, 'Could not reach that URL.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw error(502, `That URL returned an error (${response.status}).`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    throw error(400, 'That URL does not point to an image.');
  }

  const contentLength = Number(response.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BYTES) {
    throw error(413, 'That image is too large (max 15MB).');
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    throw error(413, 'That image is too large (max 15MB).');
  }

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    },
  });
};
