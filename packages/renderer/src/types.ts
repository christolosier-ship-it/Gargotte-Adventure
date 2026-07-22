import type { GridPosition, RoomState } from "@gargotte/engine";
import type { CameraRotation } from "./view";

export interface TacticalHighlights {
  reachable: GridPosition[];
  attackable: string[];
}

export interface TabletopRenderer {
  destroy(): void;
  renderRoom(state: RoomState, highlights?: TacticalHighlights): void;
  rotateCamera(): CameraRotation;
  getCameraRotation(): CameraRotation;
  onCellSelected(listener: (position: GridPosition) => void): void;
  onHeroSelected(listener: (heroId: string) => void): void;
  onEnemySelected(listener: (enemyId: string) => void): void;
}
