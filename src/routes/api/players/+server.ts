import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listPlayers, listDeletedPlayers, insertPlayer, SquadNumberConflictError } from '$lib/server/db';
import { parsePlayerInput } from '$lib/server/player-input';
import { assertLocalRequest } from '$lib/server/local-guard';

export const GET: RequestHandler = ({ url }) => {
  const status = url.searchParams.get('status');
  return json(status === 'deleted' ? listDeletedPlayers() : listPlayers());
};

export const POST: RequestHandler = async (event) => {
  assertLocalRequest(event);
  const input = parsePlayerInput(await event.request.json());
  try {
    return json(insertPlayer(input), { status: 201 });
  } catch (err) {
    if (err instanceof SquadNumberConflictError) {
      throw error(409, err.message);
    }
    throw err;
  }
};
