/**
 * Restricts an action to requests originating from this machine (loopback).
 * Used to gate roster CRUD so the squad can only be edited from the
 * computer running the server, even if the dev server is exposed on the
 * network (e.g. `vite dev --host`) or the app is deployed somewhere reachable.
 */

import { error, type RequestEvent } from '@sveltejs/kit';

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export function isLocalRequest(event: RequestEvent): boolean {
  try {
    return LOOPBACK_ADDRESSES.has(event.getClientAddress());
  } catch {
    // If the address can't be determined, fail closed rather than allow the action.
    return false;
  }
}

export function assertLocalRequest(event: RequestEvent): void {
  if (!isLocalRequest(event)) {
    throw error(403, 'The squad can only be edited from this computer.');
  }
}
