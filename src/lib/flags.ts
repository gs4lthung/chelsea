/**
 * Client-side API for CRUD on the reusable country-flag library (backed by
 * SQLite on the server, seeded once from the built-in flags in /static).
 * The player form picks a flag from this list, which copies its image onto
 * the player — so deleting a flag here doesn't affect players already using it.
 */

export interface CountryFlag {
  id: string;
  name: string;
  image: string;
}

export type FlagFormData = {
  name: string;
  image: string;
};

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.message === 'string' ? body.message : `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function fetchFlags(): Promise<CountryFlag[]> {
  const res = await fetch('/api/flags');
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function addFlag(data: FlagFormData): Promise<CountryFlag> {
  const res = await fetch('/api/flags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function updateFlag(id: string, data: FlagFormData): Promise<CountryFlag> {
  const res = await fetch(`/api/flags/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  return res.json();
}

export async function deleteFlag(id: string): Promise<void> {
  const res = await fetch(`/api/flags/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
}
