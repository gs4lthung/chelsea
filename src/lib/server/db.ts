/**
 * Server-only SQLite-backed player store.
 *
 * Uses Node's built-in `node:sqlite` (no native module build step — safer
 * than better-sqlite3 on Windows dev machines). The base squad from
 * chelsea.json seeds the table once; after that the DB is the source of
 * truth. Deletes are soft (a `deleted` flag) so removed players are
 * restorable rather than gone for good.
 */

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Player } from '$lib/players';
import type { CountryFlag } from '$lib/flags';
import { COUNTRIES } from '$lib/countries';

// chelsea.json is an optional one-time bootstrap seed, not a hard runtime
// dependency — a static `import ... from '../../chelsea.json'` would fail
// the whole build if the file is ever missing/deleted. import.meta.glob
// resolves to zero matches gracefully instead, so a missing file just means
// a fresh database starts empty (the admin adds players via /manage).
const seedFiles = import.meta.glob<{ default: unknown[] }>('../../chelsea.json', { eager: true });
const rawPlayersJson: unknown[] = Object.values(seedFiles)[0]?.default ?? [];

const projectRoot = path.dirname(fileURLToPath(import.meta.url)).split('src')[0];

/**
 * Serverless hosts (Vercel, Netlify, ...) ship a read-only filesystem outside
 * of /tmp, so creating ./data there throws at import time and 500s every
 * request. Fall back to a tmpdir there — the squad just reseeds from
 * chelsea.json each cold start, which is fine since remote requests can never
 * pass the local-only write guard (see local-guard.ts) anyway.
 */
function resolveWritableDataDir(): string {
  const preferred = path.join(projectRoot, 'data');
  try {
    mkdirSync(preferred, { recursive: true });
    return preferred;
  } catch {
    const fallback = path.join(tmpdir(), 'chelsea-data');
    mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

const dataDir = resolveWritableDataDir();

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
};

/** Ensure a /static-relative reference actually starts with a leading slash. */
function normalizeStaticPath(value: string): string {
  return value.startsWith('/') || /^(https?:|data:)/.test(value) ? value : `/${value}`;
}

/** Read a file under /static and return it as a data: URL, or null if it can't be read. */
function staticFileToDataUrl(staticPath: string): string | null {
  try {
    const filePath = path.join(projectRoot, 'static', staticPath.replace(/^\//, ''));
    const buffer = readFileSync(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime = MIME_TYPES[ext] ?? 'application/octet-stream';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * Every image reference stored in the DB should be self-contained (a data:
 * URL) rather than a pointer into /static — including the built-in flags
 * offered by the country picker, so picking one doesn't leave the row
 * depending on a static file. Already-inlined or remote URLs pass through.
 */
function resolveImageForStorage(value: string | null): string | null {
  if (!value) return null;
  if (/^(data:|https?:)/.test(value)) return value;
  return staticFileToDataUrl(normalizeStaticPath(value)) ?? normalizeStaticPath(value);
}

const db = new DatabaseSync(path.join(dataDir, 'chelsea.sqlite'));
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    number INTEGER NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    position TEXT NOT NULL,
    image TEXT NOT NULL,
    countryImage TEXT,
    isCaptain INTEGER NOT NULL DEFAULT 0,
    isSuspended INTEGER NOT NULL DEFAULT 0,
    deleted INTEGER NOT NULL DEFAULT 0
  )
`);

function seedIfEmpty(): void {
  // BEGIN IMMEDIATE takes the write lock up front, so a second process
  // starting concurrently against the same fresh DB file blocks here
  // instead of interleaving inserts with this one.
  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM players').get() as { count: number };
    if (row.count > 0) {
      db.exec('COMMIT');
      return;
    }

    const insert = db.prepare(`
      INSERT INTO players
        (id, number, firstName, lastName, position, image, countryImage, isCaptain, isSuspended, deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    const raw = rawPlayersJson as Array<Record<string, unknown>>;
    raw.forEach((p) => {
      insert.run(
        crypto.randomUUID(),
        Number(p.id),
        String(p.firstName ?? ''),
        String(p.lastName ?? ''),
        String(p.position ?? ''),
        String(p.image ?? ''),
        p.countryImage ? normalizeStaticPath(String(p.countryImage)) : null,
        p.isCaptain === true ? 1 : 0,
        p.isSuspended === true ? 1 : 0
      );
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

seedIfEmpty();

/**
 * One-time (per row) migration: any player still pointing at a /static
 * image path — from the original seed, or a built-in flag picked before
 * the country picker also inlined its selection — gets it converted to a
 * data: URL too, so the DB is fully self-contained. Idempotent: only
 * touches rows that aren't already data:/http(s):, so this is a no-op
 * after the first run.
 */
function migrateStaticImagesToBase64(): void {
  const isStaticRef = (column: string) =>
    `${column} NOT LIKE 'data:%' AND ${column} NOT LIKE 'http:%' AND ${column} NOT LIKE 'https:%'`;
  const photoRows = db
    .prepare(`SELECT id, image FROM players WHERE ${isStaticRef('image')}`)
    .all() as Array<{ id: string; image: string }>;
  const flagRows = db
    .prepare(`SELECT id, countryImage FROM players WHERE countryImage IS NOT NULL AND ${isStaticRef('countryImage')}`)
    .all() as Array<{ id: string; countryImage: string }>;

  if (photoRows.length === 0 && flagRows.length === 0) return;

  const updateImage = db.prepare('UPDATE players SET image = ? WHERE id = ?');
  const updateFlag = db.prepare('UPDATE players SET countryImage = ? WHERE id = ?');
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const row of photoRows) {
      const dataUrl = staticFileToDataUrl(row.image);
      if (dataUrl) updateImage.run(dataUrl, row.id);
    }
    for (const row of flagRows) {
      const dataUrl = staticFileToDataUrl(row.countryImage);
      if (dataUrl) updateFlag.run(dataUrl, row.id);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

migrateStaticImagesToBase64();

db.exec(`
  CREATE TABLE IF NOT EXISTS country_flags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL
  )
`);

function seedFlagsIfEmpty(): void {
  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM country_flags').get() as { count: number };
    if (row.count > 0) {
      db.exec('COMMIT');
      return;
    }

    const insert = db.prepare('INSERT INTO country_flags (id, name, image) VALUES (?, ?, ?)');
    for (const country of COUNTRIES) {
      const image = staticFileToDataUrl(country.flag) ?? normalizeStaticPath(country.flag);
      insert.run(crypto.randomUUID(), country.name, image);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

seedFlagsIfEmpty();

type PlayerRow = {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  position: string;
  image: string;
  countryImage: string | null;
  isCaptain: number;
  isSuspended: number;
  deleted: number;
};

function rowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    number: row.number,
    firstName: row.firstName,
    lastName: row.lastName,
    position: row.position,
    image: row.image,
    countryImage: row.countryImage ?? undefined,
    isCaptain: row.isCaptain === 1,
    isSuspended: row.isSuspended === 1,
  };
}

export class SquadNumberConflictError extends Error {
  constructor(number: number) {
    super(`Squad number ${number} is already taken.`);
    this.name = 'SquadNumberConflictError';
  }
}

const ORDER_BY_CAPTAIN_THEN_NUMBER = 'ORDER BY isCaptain DESC, number ASC, rowid ASC';

export function listPlayers(): Player[] {
  const rows = db
    .prepare(`SELECT * FROM players WHERE deleted = 0 ${ORDER_BY_CAPTAIN_THEN_NUMBER}`)
    .all() as PlayerRow[];
  return rows.map(rowToPlayer);
}

export function listDeletedPlayers(): Player[] {
  const rows = db
    .prepare(`SELECT * FROM players WHERE deleted = 1 ${ORDER_BY_CAPTAIN_THEN_NUMBER}`)
    .all() as PlayerRow[];
  return rows.map(rowToPlayer);
}

export function getPlayer(id: string): Player | null {
  const row = db.prepare('SELECT * FROM players WHERE id = ?').get(id) as PlayerRow | undefined;
  return row ? rowToPlayer(row) : null;
}

export interface PlayerInput {
  number: number;
  firstName: string;
  lastName: string;
  position: string;
  image: string;
  countryImage?: string | null;
  isCaptain: boolean;
  isSuspended: boolean;
}

function assertNumberAvailable(number: number, excludingId?: string): void {
  const conflict = db
    .prepare('SELECT id FROM players WHERE number = ? AND deleted = 0 AND id != ?')
    .get(number, excludingId ?? '') as { id: string } | undefined;
  if (conflict) {
    throw new SquadNumberConflictError(number);
  }
}

export function insertPlayer(data: PlayerInput): Player {
  assertNumberAvailable(data.number);

  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO players
      (id, number, firstName, lastName, position, image, countryImage, isCaptain, isSuspended, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
  ).run(
    id,
    data.number,
    data.firstName,
    data.lastName,
    data.position,
    data.image,
    resolveImageForStorage(data.countryImage ?? null),
    data.isCaptain ? 1 : 0,
    data.isSuspended ? 1 : 0
  );

  return getPlayer(id) as Player;
}

export function updatePlayer(id: string, data: PlayerInput): Player {
  const existing = getPlayer(id);
  if (!existing) {
    throw new Error(`Player ${id} not found`);
  }
  assertNumberAvailable(data.number, id);

  db.prepare(
    `UPDATE players
     SET number = ?, firstName = ?, lastName = ?, position = ?, image = ?,
         countryImage = ?, isCaptain = ?, isSuspended = ?
     WHERE id = ?`
  ).run(
    data.number,
    data.firstName,
    data.lastName,
    data.position,
    data.image,
    resolveImageForStorage(data.countryImage ?? null),
    data.isCaptain ? 1 : 0,
    data.isSuspended ? 1 : 0,
    id
  );

  return getPlayer(id) as Player;
}

export function softDeletePlayer(id: string): void {
  db.prepare('UPDATE players SET deleted = 1 WHERE id = ?').run(id);
}

export function restorePlayer(id: string): void {
  const row = db.prepare('SELECT number FROM players WHERE id = ?').get(id) as
    | { number: number }
    | undefined;
  if (!row) {
    throw new Error(`Player ${id} not found`);
  }
  assertNumberAvailable(row.number, id);
  db.prepare('UPDATE players SET deleted = 0 WHERE id = ?').run(id);
}

export class FlagNameConflictError extends Error {
  constructor(name: string) {
    super(`A flag named "${name}" already exists.`);
    this.name = 'FlagNameConflictError';
  }
}

type FlagRow = { id: string; name: string; image: string };

function rowToFlag(row: FlagRow): CountryFlag {
  return { id: row.id, name: row.name, image: row.image };
}

function assertFlagNameAvailable(name: string, excludingId?: string): void {
  const conflict = db
    .prepare('SELECT id FROM country_flags WHERE name = ? COLLATE NOCASE AND id != ?')
    .get(name, excludingId ?? '') as { id: string } | undefined;
  if (conflict) {
    throw new FlagNameConflictError(name);
  }
}

export interface FlagInput {
  name: string;
  image: string;
}

export function listFlags(): CountryFlag[] {
  const rows = db.prepare('SELECT * FROM country_flags ORDER BY name ASC').all() as FlagRow[];
  return rows.map(rowToFlag);
}

export function getFlag(id: string): CountryFlag | null {
  const row = db.prepare('SELECT * FROM country_flags WHERE id = ?').get(id) as FlagRow | undefined;
  return row ? rowToFlag(row) : null;
}

export function insertFlag(data: FlagInput): CountryFlag {
  assertFlagNameAvailable(data.name);

  const id = crypto.randomUUID();
  db.prepare('INSERT INTO country_flags (id, name, image) VALUES (?, ?, ?)').run(
    id,
    data.name,
    resolveImageForStorage(data.image) ?? data.image
  );

  return getFlag(id) as CountryFlag;
}

export function updateFlag(id: string, data: FlagInput): CountryFlag {
  const existing = getFlag(id);
  if (!existing) {
    throw new Error(`Flag ${id} not found`);
  }
  assertFlagNameAvailable(data.name, id);

  db.prepare('UPDATE country_flags SET name = ?, image = ? WHERE id = ?').run(
    data.name,
    resolveImageForStorage(data.image) ?? data.image,
    id
  );

  return getFlag(id) as CountryFlag;
}

export function deleteFlag(id: string): void {
  db.prepare('DELETE FROM country_flags WHERE id = ?').run(id);
}
