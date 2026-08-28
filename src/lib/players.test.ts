/**
 * Tests for player utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validatePlayer,
  validatePlayers,
  getPlayerFullName,
  getPlayerDisplayName,
  isCaptain,
  isSuspended,
  getPlayerAtIndex,
  getTotalPlayers,
  getCaptain,
  getSuspendedPlayers,
  type Player,
} from './players';

// Mock player data
const mockPlayer: Player = {
  id: 24,
  firstName: 'Reece',
  lastName: 'James',
  position: 'RB',
  image: '/24.png',
  countryImage: '/england.png',
  isCaptain: true,
};

const mockSuspendedPlayer: Player = {
  id: 404,
  firstName: 'Mykhailo',
  lastName: 'Mudryk',
  position: 'LW',
  image: '/404.png',
  countryImage: '/ukraina.png',
  isSuspended: true,
};

describe('validatePlayer', () => {
  it('should validate a correct player object', () => {
    const result = validatePlayer(mockPlayer);
    expect(result).toEqual(mockPlayer);
  });

  it('should throw error for null data', () => {
    expect(() => validatePlayer(null)).toThrow('Player data must be an object');
  });

  it('should throw error for missing id', () => {
    const invalidPlayer = { ...mockPlayer, id: undefined };
    expect(() => validatePlayer(invalidPlayer)).toThrow('id field');
  });

  it('should throw error for invalid firstName', () => {
    const invalidPlayer = { ...mockPlayer, firstName: 123 };
    expect(() => validatePlayer(invalidPlayer as unknown as Player)).toThrow(
      'firstName string'
    );
  });

  it('should throw error for invalid lastName', () => {
    const invalidPlayer = { ...mockPlayer, lastName: null };
    expect(() => validatePlayer(invalidPlayer as unknown as Player)).toThrow(
      'lastName string'
    );
  });

  it('should throw error for invalid position', () => {
    const invalidPlayer = { ...mockPlayer, position: undefined };
    expect(() => validatePlayer(invalidPlayer)).toThrow('position string');
  });

  it('should throw error for invalid image', () => {
    const invalidPlayer = { ...mockPlayer, image: null };
    expect(() => validatePlayer(invalidPlayer as unknown as Player)).toThrow(
      'image string'
    );
  });

  it('should throw error for invalid countryImage', () => {
    const invalidPlayer = { ...mockPlayer, countryImage: 456 };
    expect(() => validatePlayer(invalidPlayer as unknown as Player)).toThrow(
      'countryImage string'
    );
  });

  it('should handle optional isCaptain field', () => {
    const playerWithoutCaptain = { ...mockPlayer, isCaptain: undefined };
    const result = validatePlayer(playerWithoutCaptain);
    expect(result.isCaptain).toBe(false);
  });

  it('should handle optional isSuspended field', () => {
    const playerWithoutSuspended = { ...mockPlayer, isSuspended: undefined };
    const result = validatePlayer(playerWithoutSuspended);
    expect(result.isSuspended).toBe(false);
  });
});

describe('validatePlayers', () => {
  it('should validate an array of players', () => {
    const players = [mockPlayer, mockSuspendedPlayer];
    const result = validatePlayers(players as unknown[]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockPlayer);
    expect(result[1]).toEqual(mockSuspendedPlayer);
  });

  it('should throw error for invalid player in array', () => {
    const invalidPlayers = [mockPlayer, null];
    expect(() => validatePlayers(invalidPlayers as unknown[])).toThrow();
  });
});

describe('getPlayerFullName', () => {
  it('should concatenate first and last name', () => {
    expect(getPlayerFullName(mockPlayer)).toBe('ReeceJames');
  });

  it('should handle empty firstName', () => {
    const playerWithEmptyFirstName = { ...mockPlayer, firstName: '', lastName: 'Estêvão' };
    expect(getPlayerFullName(playerWithEmptyFirstName)).toBe('Estêvão');
  });

  it('should handle spaces in names', () => {
    const playerWithSpaces = { ...mockPlayer, firstName: 'Kiernan', lastName: ' Dewsbury-Hall' };
    expect(getPlayerFullName(playerWithSpaces)).toBe('Kiernan Dewsbury-Hall');
  });
});

describe('getPlayerDisplayName', () => {
  it('should return formatted display name', () => {
    expect(getPlayerDisplayName(mockPlayer)).toBe('Reece James');
  });

  it('should handle empty firstName', () => {
    const playerWithEmptyFirstName = { ...mockPlayer, firstName: '', lastName: 'Estêvão' };
    expect(getPlayerDisplayName(playerWithEmptyFirstName)).toBe('Estêvão');
  });
});

describe('isCaptain', () => {
  it('should return true for captain', () => {
    expect(isCaptain(mockPlayer)).toBe(true);
  });

  it('should return false for non-captain', () => {
    expect(isCaptain(mockSuspendedPlayer)).toBe(false);
  });

  it('should return false when isCaptain is undefined', () => {
    const playerWithoutCaptain = { ...mockPlayer, isCaptain: undefined };
    expect(isCaptain(playerWithoutCaptain)).toBe(false);
  });
});

describe('isSuspended', () => {
  it('should return true for suspended player', () => {
    expect(isSuspended(mockSuspendedPlayer)).toBe(true);
  });

  it('should return false for non-suspended player', () => {
    expect(isSuspended(mockPlayer)).toBe(false);
  });

  it('should return false when isSuspended is undefined', () => {
    const playerWithoutSuspended = { ...mockPlayer, isSuspended: undefined };
    expect(isSuspended(playerWithoutSuspended)).toBe(false);
  });
});

describe('getPlayerAtIndex', () => {
  const testPlayers = [
    mockPlayer,
    mockSuspendedPlayer,
    { ...mockPlayer, id: 1, firstName: 'Robert', lastName: 'Sánchez' },
  ];

  it('should return player at valid index', () => {
    expect(getPlayerAtIndex(0, testPlayers)).toEqual(mockPlayer);
  });

  it('should handle negative index with wraparound', () => {
    expect(getPlayerAtIndex(-1, testPlayers)).toEqual(testPlayers[2]);
  });

  it('should handle index greater than array length with wraparound', () => {
    expect(getPlayerAtIndex(3, testPlayers)).toEqual(testPlayers[0]);
  });

  it('should handle very large index', () => {
    expect(getPlayerAtIndex(100, testPlayers)).toEqual(testPlayers[1]);
  });
});

describe('getTotalPlayers', () => {
  it('should return the total number of players', () => {
    const total = getTotalPlayers();
    expect(total).toBeGreaterThan(0);
    expect(typeof total).toBe('number');
  });
});

describe('getCaptain', () => {
  it('should return the captain player', () => {
    const captain = getCaptain();
    expect(captain).toBeDefined();
    expect(captain?.isCaptain).toBe(true);
  });
});

describe('getSuspendedPlayers', () => {
  it('should return array of suspended players', () => {
    const suspended = getSuspendedPlayers();
    expect(Array.isArray(suspended)).toBe(true);
    expect(suspended.length).toBeGreaterThanOrEqual(1);
    if (suspended.length > 0) {
      expect(suspended[0].isSuspended).toBe(true);
    }
  });
});
