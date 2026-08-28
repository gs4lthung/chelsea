/**
 * Type-safe player data module with validation
 */

export interface Player {
  /** Stable internal identifier — not shown in the UI, never edited by users. */
  id: number | string;
  /** Jersey / squad number — user-editable, shown on cards and badges. */
  number?: number;
  firstName: string;
  lastName: string;
  position: string;
  image: string;
  countryImage?: string;
  isCaptain?: boolean;
  isSuspended?: boolean;
}

/**
 * Zod-like validation for player data
 * Throws detailed error if validation fails
 */
export function validatePlayer(data: unknown): Player {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Player data must be an object');
  }

  const player = data as Record<string, unknown>;

  // Validate required fields
  if (player.id === undefined) {
    throw new Error('Player must have an id field');
  }
  if (typeof player.firstName !== 'string') {
    throw new Error('Player must have a firstName string');
  }
  if (typeof player.lastName !== 'string') {
    throw new Error('Player must have a lastName string');
  }
  if (typeof player.position !== 'string') {
    throw new Error('Player must have a position string');
  }
  if (typeof player.image !== 'string') {
    throw new Error('Player must have an image string');
  }
  if (player.countryImage !== undefined && typeof player.countryImage !== 'string') {
    throw new Error('Player countryImage must be a string when present');
  }

  return {
    id: player.id as number | string,
    firstName: player.firstName,
    lastName: player.lastName,
    position: player.position,
    image: player.image,
    countryImage: (player.countryImage as string | undefined) || undefined,
    isCaptain: player.isCaptain === true,
    isSuspended: player.isSuspended === true,
  };
}

/**
 * Validate an array of player data
 */
export function validatePlayers(data: unknown[]): Player[] {
  return data.map(validatePlayer);
}

/**
 * Get player's full name
 */
export function getPlayerFullName(player: Player): string {
  return `${player.firstName}${player.lastName}`.trim();
}

/**
 * Get player display name with proper formatting
 */
export function getPlayerDisplayName(player: Player): string {
  return `${player.firstName} ${player.lastName}`.trim();
}

/**
 * Check if a player is the captain
 */
export function isCaptain(player: Player): boolean {
  return player.isCaptain === true;
}

/**
 * Check if a player is suspended
 */
export function isSuspended(player: Player): boolean {
  return player.isSuspended === true;
}

/**
 * Import and validate raw player data
 */
async function loadRawData(): Promise<unknown[]> {
  const rawData = await import('../chelsea.json');
  return rawData.default as unknown[];
}

/**
 * Get validated players array
 * This is the main export to use in components
 */
export async function getPlayers(): Promise<Player[]> {
  const rawData = await loadRawData();
  return validatePlayers(rawData);
}

/**
 * Get players synchronously (for SSR/hydration compatibility)
 * Note: This returns the raw JSON import directly
 */
import rawPlayersJson from '../chelsea.json';
export const players: Player[] = validatePlayers(rawPlayersJson as unknown[]);

/**
 * Get a player by index with wraparound
 */
export function getPlayerAtIndex(index: number, playerList: Player[] = players): Player {
  const wrappedIndex = (index % playerList.length + playerList.length) % playerList.length;
  return playerList[wrappedIndex];
}

/**
 * Get total number of players
 */
export function getTotalPlayers(): number {
  return players.length;
}

/**
 * Get captain player
 */
export function getCaptain(): Player | undefined {
  return players.find(isCaptain);
}

/**
 * Get all suspended players
 */
export function getSuspendedPlayers(): Player[] {
  return players.filter(isSuspended);
}
