import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlayer, restorePlayer, SquadNumberConflictError } from '$lib/server/db';
import { assertLocalRequest } from '$lib/server/local-guard';

export const POST: RequestHandler = (event) => {
  assertLocalRequest(event);
  const { params } = event;
  if (!getPlayer(params.id)) {
    throw error(404, 'Player not found.');
  }
  try {
    restorePlayer(params.id);
    return json({ ok: true });
  } catch (err) {
    if (err instanceof SquadNumberConflictError) {
      throw error(409, err.message);
    }
    throw err;
  }
};
