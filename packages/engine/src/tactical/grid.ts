import type { Combatant, GridPosition, RoomState } from "./types";
export const comparePositions = (a: GridPosition, b: GridPosition): number =>
  a.row - b.row || a.column - b.column;
export const samePosition = (a: GridPosition, b: GridPosition): boolean =>
  a.column === b.column && a.row === b.row;
export const positionKey = (p: GridPosition): string => `${p.column},${p.row}`;
export const manhattanDistance = (a: GridPosition, b: GridPosition): number =>
  Math.abs(a.column - b.column) + Math.abs(a.row - b.row);
export const isWithinBounds = (
  p: GridPosition,
  width: number,
  height: number,
): boolean =>
  Number.isInteger(p.column) &&
  Number.isInteger(p.row) &&
  p.column >= 0 &&
  p.row >= 0 &&
  p.column < width &&
  p.row < height;
export function getOrthogonalNeighbors(
  p: GridPosition,
  width: number,
  height: number,
): GridPosition[] {
  return [
    { column: p.column, row: p.row - 1 },
    { column: p.column - 1, row: p.row },
    { column: p.column + 1, row: p.row },
    { column: p.column, row: p.row + 1 },
  ]
    .filter((n) => isWithinBounds(n, width, height))
    .sort(comparePositions);
}
export const isObstacle = (
  p: GridPosition,
  obstacles: GridPosition[],
): boolean => obstacles.some((o) => samePosition(o, p));
export function livingCombatants(state: RoomState): Combatant[] {
  return [...state.heroes, ...state.enemies].filter((c) => c.alive);
}
export function occupantAt(
  state: RoomState,
  p: GridPosition,
  ignoreId?: string,
): Combatant | undefined {
  return livingCombatants(state).find(
    (c) => c.id !== ignoreId && c.blocksMovement && samePosition(c.position, p),
  );
}
export function isBlocked(
  state: RoomState,
  p: GridPosition,
  ignoreId?: string,
): boolean {
  return (
    !isWithinBounds(p, state.width, state.height) ||
    isObstacle(p, state.obstacles) ||
    Boolean(occupantAt(state, p, ignoreId))
  );
}
