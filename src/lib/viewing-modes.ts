/**
 * Formation view system with dynamic player positioning
 */

import type { Player } from "./players";
import { players as defaultPlayers } from "./players";

export type ViewingMode = "individual" | "team" | "formation";

export interface FormationSlot {
  id: string;
  x: number;
  y: number;
  label: string;
  playerIds: (number | string)[];
}

/**
 * View mode configuration
 */
export const VIEWING_MODES = [
  { id: "individual" as ViewingMode, label: "Individual" },
  { id: "team" as ViewingMode, label: "All Team" },
  { id: "formation" as ViewingMode, label: "Formation" },
] as const;

/**
 * Split array of player IDs evenly between two sides
 * Returns [leftSide, rightSide]
 */
function splitPlayersEvenly(
  playerIds: (number | string)[],
): [(number | string)[], (number | string)[]] {
  const midPoint = Math.ceil(playerIds.length / 2);
  return [playerIds.slice(0, midPoint), playerIds.slice(midPoint)];
}

/**
 * Split array of player IDs with odd indices on left, even indices on right
 * For CM: 1st and 3rd on left, 2nd on right
 * Returns [leftSide, rightSide]
 */
function splitPlayersAlternating(
  playerIds: (number | string)[],
): [(number | string)[], (number | string)[]] {
  const leftSide: (number | string)[] = [];
  const rightSide: (number | string)[] = [];

  playerIds.forEach((id, index) => {
    if (index % 2 === 0) {
      leftSide.push(id); // 0, 2, 4... -> 1st, 3rd, 5th...
    } else {
      rightSide.push(id); // 1, 3, 5... -> 2nd, 4th, 6th...
    }
  });

  return [leftSide, rightSide];
}

/**
 * Get all player IDs for a given position
 */
function getPlayerIdsByPosition(
  position: string,
  players: Player[],
): (number | string)[] {
  return players.filter((p) => p.position === position).map((p) => p.id);
}

/**
 * Get formation slots for 4-3-3 formation
 * Maps player IDs to their tactical positions.
 * Accepts the live roster so added/edited/removed players are reflected;
 * defaults to the base squad for convenience.
 */
export function getFormationSlots(players: Player[] = defaultPlayers): FormationSlot[] {
  // Get players by position
  const gkPlayers = getPlayerIdsByPosition("GK", players);
  const lbPlayers = getPlayerIdsByPosition("LB", players);
  const rbPlayers = getPlayerIdsByPosition("RB", players);
  const cbPlayers = getPlayerIdsByPosition("CB", players);
  const cdmPlayers = getPlayerIdsByPosition("CDM", players);
  const cmPlayers = getPlayerIdsByPosition("CM", players);
  const camPlayers = getPlayerIdsByPosition("CAM", players);
  const lwPlayers = getPlayerIdsByPosition("LW", players);
  const rwPlayers = getPlayerIdsByPosition("RW", players);
  const stPlayers = getPlayerIdsByPosition("ST", players);
  const managerPlayers = getPlayerIdsByPosition("Manager", players);

  // Auto-split CBs between left and right (alternating: 1st, 3rd on left; 2nd on right)
  const [lcbPlayers, rcbPlayers] = splitPlayersAlternating(cbPlayers);

  // Auto-split CMs between left and right (alternating: 1st, 3rd on left; 2nd on right)
  const [lcmPlayers, rcmPlayers] = splitPlayersAlternating(cmPlayers);

  return [
    // Goalkeeper
    { id: "gk", x: 50, y: 90, label: "GK", playerIds: gkPlayers },

    // Defenders
    { id: "lb", x: 15, y: 65, label: "LB", playerIds: lbPlayers },
    { id: "lcb1", x: 30, y: 75, label: "CB", playerIds: lcbPlayers },
    { id: "rcb", x: 65, y: 75, label: "CB", playerIds: rcbPlayers },
    { id: "rb", x: 85, y: 65, label: "RB", playerIds: rbPlayers },

    // Midfielders
    { id: "cdm", x: 50, y: 55, label: "CDM", playerIds: cdmPlayers },
    { id: "cm", x: 35, y: 40, label: "CM", playerIds: lcmPlayers },
    { id: "cm2", x: 65, y: 40, label: "CM", playerIds: rcmPlayers },

    // Forwards
    { id: "lw", x: 15, y: 15, label: "LW", playerIds: lwPlayers },
    { id: "st", x: 50, y: 15, label: "ST", playerIds: stPlayers },
    { id: "rw", x: 85, y: 15, label: "RW", playerIds: rwPlayers },
    // Attacking Midfielder (center)
    { id: "cam", x: 50, y: 30, label: "CAM", playerIds: camPlayers },

    // Manager
    { id: "manager", x: 50, y: 5, label: "Manager", playerIds: managerPlayers },
  ];
}

/**
 * Get formation slot ID for a player based on their position
 */
export function getFormationSlotForPlayer(player: Player): string | null {
  const positionToSlotMap: Record<string, string> = {
    GK: "gk",
    LB: "lb",
    CB: "lcb1", // Default CBs to left center back
    RB: "rb",
    CDM: "cdm",
    CM: "cm",
    CAM: "cam",
    LW: "lw",
    RW: "rw",
    ST: "st",
    Manager: "manager",
  };

  return positionToSlotMap[player.position] || null;
}
