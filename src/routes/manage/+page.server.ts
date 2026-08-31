import type { PageServerLoad } from './$types';
import { listPlayers, listDeletedPlayers, listFlags } from '$lib/server/db';
import { assertLocalRequest } from '$lib/server/local-guard';

export const load: PageServerLoad = (event) => {
  assertLocalRequest(event);
  return { players: listPlayers(), removed: listDeletedPlayers(), flags: listFlags() };
};
