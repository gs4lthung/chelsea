import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlayer, updatePlayer, softDeletePlayer, SquadNumberConflictError } from '$lib/server/db';
import { parsePlayerInput } from '$lib/server/player-input';
import { assertLocalRequest } from '$lib/server/local-guard';

export const PATCH: RequestHandler = async (event) => {
  assertLocalRequest(event);
  const { params, request } = event;
  if (!getPlayer(params.id)) {
    throw error(404, 'Player not found.');
  }
  const input = parsePlayerInput(await request.json());
  try {
    return json(updatePlayer(params.id, input));
  } catch (err) {
    if (err instanceof SquadNumberConflictError) {
      throw error(409, err.message);
    }
    throw err;
  }
};

export const DELETE: RequestHandler = (event) => {
  assertLocalRequest(event);
  const { params } = event;
  if (!getPlayer(params.id)) {
    throw error(404, 'Player not found.');
  }
  softDeletePlayer(params.id);
  return json({ ok: true });
};
