import { error } from '@sveltejs/kit';
import type { FlagInput } from './db';

export function parseFlagInput(body: unknown): FlagInput {
  const b = (body ?? {}) as Record<string, unknown>;

  if (typeof b.name !== 'string' || !b.name.trim()) {
    throw error(400, 'Flag name is required.');
  }
  if (typeof b.image !== 'string' || !b.image.trim()) {
    throw error(400, 'Flag image is required.');
  }

  return {
    name: b.name.trim(),
    image: b.image,
  };
}
