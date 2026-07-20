import { isObstacle, livingCombatants, samePosition } from "./grid";
import type { GridPosition, RoomState } from "./types";
export function supercoverLine(
  from: GridPosition,
  to: GridPosition,
): GridPosition[] {
  const dx = to.column - from.column;
  const dy = to.row - from.row;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if (steps === 0) return [from];
  const cells: GridPosition[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const p = {
      column: Math.round(from.column + dx * t),
      row: Math.round(from.row + dy * t),
    };
    if (!cells.some((c) => samePosition(c, p))) cells.push(p);
  }
  return cells;
}
export function hasLineOfSight(
  state: RoomState,
  from: GridPosition,
  to: GridPosition,
  ignoreIds: string[] = [],
): boolean {
  const blockers = supercoverLine(from, to).slice(1, -1);
  return blockers.every(
    (p) =>
      !isObstacle(p, state.obstacles) &&
      !livingCombatants(state).some(
        (c) =>
          c.blocksMovement &&
          !ignoreIds.includes(c.id) &&
          samePosition(c.position, p),
      ),
  );
}
