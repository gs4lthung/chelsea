import type { PageServerLoad } from './$types';
import { listPlayers } from '$lib/server/db';
import { isLocalRequest } from '$lib/server/local-guard';
import { VIEWING_MODES, type ViewingMode } from '$lib/viewing-modes';

const VALID_MODES = new Set<string>(VIEWING_MODES.map((m) => m.id));

export const load: PageServerLoad = (event) => {
  const players = listPlayers();
  const requestedId = event.url.searchParams.get('player');
  const initialPlayerId = players.some((p) => String(p.id) === requestedId) ? requestedId : null;

  const requestedMode = event.url.searchParams.get('mode');
  const initialViewingMode: ViewingMode = VALID_MODES.has(requestedMode ?? '')
    ? (requestedMode as ViewingMode)
    : 'individual';

  return { players, canManage: isLocalRequest(event), initialPlayerId, initialViewingMode };
};
