import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listFlags, insertFlag, FlagNameConflictError } from '$lib/server/db';
import { parseFlagInput } from '$lib/server/flag-input';
import { assertLocalRequest } from '$lib/server/local-guard';

export const GET: RequestHandler = () => {
  return json(listFlags());
};

export const POST: RequestHandler = async (event) => {
  assertLocalRequest(event);
  const input = parseFlagInput(await event.request.json());
  try {
    return json(insertFlag(input), { status: 201 });
  } catch (err) {
    if (err instanceof FlagNameConflictError) {
      throw error(409, err.message);
    }
    throw err;
  }
};
