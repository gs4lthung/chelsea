import type { PageServerLoad } from './$types';
import { listPlayers, listDeletedPlayers } from '$lib/server/db';
import { assertLocalRequest } from '$lib/server/local-guard';

export const load: PageServerLoad = (event) => {
  assertLocalRequest(event);
  return { players: listPlayers(), removed: listDeletedPlayers() };
};
