/**
 * Client-side API for mutating the squad roster (backed by SQLite on the server).
 * Initial page loads read the DB directly via `+page.server.ts` — this module
 * only handles create/update/delete/restore calls triggered from the UI.
 */

import type { Player } from './players';

export type PlayerFormData = {
  number: number;
  firstName: string;
  lastName: string;
  position: string;
  isCaptain: boolean;
  isSuspended: boolean;
  image: string;
  countryImage?: string | null;
};

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.message === 'string' ? body.message : `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function addPlayer(data: PlayerFormData): Promise<Player> {
  const res = await fetch('/api/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updatePlayer(id: Player['id'], data: PlayerFormData): Promise<Player> {
  const res = await fetch(`/api/players/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function deletePlayer(id: Player['id']): Promise<void> {
  const res = await fetch(`/api/players/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}

export async function restorePlayer(id: Player['id']): Promise<void> {
  const res = await fetch(`/api/players/${encodeURIComponent(String(id))}/restore`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}
