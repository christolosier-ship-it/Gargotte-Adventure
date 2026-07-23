import {
  isObstacle,
  isWithinBounds,
  occupantAt,
  samePosition,
} from "./grid";
import type {
  GridPosition,
  HeroState,
  InteractableInstance,
  RoomState,
} from "./types";

export interface InteractableMovementResult {
  position: GridPosition;
  event: {
    type: "interactable-moved";
    requestId: string;
    interactableInstanceId: string;
    from: GridPosition;
    to: GridPosition;
    cause: { type: "hero-interaction"; id: string };
  } | null;
}

export function resolveHeroObjectMovement(
  state: RoomState,
  hero: HeroState,
  instance: InteractableInstance,
  requestId: string,
  movement: { type: "push"; distance: 1 } | undefined,
): InteractableMovementResult | null {
  if (!movement) return { position: instance.position, event: null };

  const direction = {
    column: instance.position.column - hero.position.column,
    row: instance.position.row - hero.position.row,
  };
  const destination = {
    column: instance.position.column + direction.column * movement.distance,
    row: instance.position.row + direction.row * movement.distance,
  };
  if (!canOccupy(state, destination, instance.id)) return null;

  return {
    position: destination,
    event: {
      type: "interactable-moved",
      requestId,
      interactableInstanceId: instance.id,
      from: instance.position,
      to: destination,
      cause: { type: "hero-interaction", id: requestId },
    },
  };
}

function canOccupy(
  state: RoomState,
  position: GridPosition,
  movingId: string,
): boolean {
  return (
    isWithinBounds(position, state.width, state.height) &&
    !isObstacle(position, state.obstacles) &&
    !occupantAt(state, position) &&
    !state.interactables.some(
      (candidate) =>
        candidate.id !== movingId && samePosition(candidate.position, position),
    )
  );
}
