import { isObstacle, livingCombatants, samePosition } from "./grid";
import type { GridPosition, RoomState } from "./types";

function pushUnique(cells: GridPosition[], position: GridPosition): void {
  if (!cells.some((cell) => samePosition(cell, position))) cells.push(position);
}

/**
 * Returns every grid cell touched by the segment joining the centres of two
 * cells. When the segment crosses an exact corner, both adjacent cells are
 * included so an obstacle cannot be visually skimmed through its corner.
 */
export function supercoverLine(
  from: GridPosition,
  to: GridPosition,
): GridPosition[] {
  const dx = to.column - from.column;
  const dy = to.row - from.row;
  const nx = Math.abs(dx);
  const ny = Math.abs(dy);
  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);

  let column = from.column;
  let row = from.row;
  let ix = 0;
  let iy = 0;
  const cells: GridPosition[] = [{ ...from }];

  while (ix < nx || iy < ny) {
    const crossX = (1 + 2 * ix) * ny;
    const crossY = (1 + 2 * iy) * nx;

    if (crossX === crossY) {
      if (ix < nx) pushUnique(cells, { column: column + stepX, row });
      if (iy < ny) pushUnique(cells, { column, row: row + stepY });
      column += stepX;
      row += stepY;
      ix += 1;
      iy += 1;
      pushUnique(cells, { column, row });
    } else if (crossX < crossY) {
      column += stepX;
      ix += 1;
      pushUnique(cells, { column, row });
    } else {
      row += stepY;
      iy += 1;
      pushUnique(cells, { column, row });
    }
  }

  return cells;
}

export function hasLineOfSight(
  state: RoomState,
  from: GridPosition,
  to: GridPosition,
  ignoreIds: string[] = [],
): boolean {
  const blockers = supercoverLine(from, to).filter(
    (position) => !samePosition(position, from) && !samePosition(position, to),
  );

  return blockers.every(
    (position) =>
      !isObstacle(position, state.obstacles) &&
      !livingCombatants(state).some(
        (combatant) =>
          combatant.blocksMovement &&
          !ignoreIds.includes(combatant.id) &&
          samePosition(combatant.position, position),
      ),
  );
}
