import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/config';

export const prerender = true;

export const GET: RequestHandler = () => {
  const body = `User-agent: *
Allow: /
Disallow: /manage
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
