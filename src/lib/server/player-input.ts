import { error } from '@sveltejs/kit';
import type { PlayerInput } from './db';

export function parsePlayerInput(body: unknown): PlayerInput {
  const b = (body ?? {}) as Record<string, unknown>;
  const number = Number(b.number);

  if (!Number.isInteger(number) || number < 0) {
    throw error(400, 'Squad number must be a non-negative integer.');
  }
  if (typeof b.firstName !== 'string' || !b.firstName.trim()) {
    throw error(400, 'First name is required.');
  }
  if (typeof b.lastName !== 'string' || !b.lastName.trim()) {
    throw error(400, 'Last name is required.');
  }
  if (typeof b.position !== 'string' || !b.position.trim()) {
    throw error(400, 'Position is required.');
  }
  if (typeof b.image !== 'string' || !b.image.trim()) {
    throw error(400, 'A photo is required.');
  }

  return {
    number,
    firstName: b.firstName.trim(),
    lastName: b.lastName.trim(),
    position: b.position.trim(),
    image: b.image,
    countryImage: typeof b.countryImage === 'string' ? b.countryImage : null,
    isCaptain: b.isCaptain === true,
    isSuspended: b.isSuspended === true,
  };
}
