import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFlag, updateFlag, deleteFlag, FlagNameConflictError } from '$lib/server/db';
import { parseFlagInput } from '$lib/server/flag-input';
import { assertLocalRequest } from '$lib/server/local-guard';

export const PATCH: RequestHandler = async (event) => {
  assertLocalRequest(event);
  const { params, request } = event;
  if (!getFlag(params.id)) {
    throw error(404, 'Flag not found.');
  }
  const input = parseFlagInput(await request.json());
  try {
    return json(updateFlag(params.id, input));
  } catch (err) {
    if (err instanceof FlagNameConflictError) {
      throw error(409, err.message);
    }
    throw err;
  }
};

export const DELETE: RequestHandler = (event) => {
  assertLocalRequest(event);
  const { params } = event;
  if (!getFlag(params.id)) {
    throw error(404, 'Flag not found.');
  }
  deleteFlag(params.id);
  return json({ ok: true });
};
