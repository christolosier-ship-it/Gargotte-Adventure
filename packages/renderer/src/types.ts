import type { GridPosition, RoomState } from "@gargotte/engine";
import type { VisualPresentationCue } from "@gargotte/presentation";
import type { CameraRotation } from "./view";

export interface TacticalHighlights {
  reachable: GridPosition[];
  attackable: string[];
}

export interface PresentationPlaybackOptions {
  reducedMotion: boolean;
}

export interface TabletopRenderer {
  destroy(): void;
  renderRoom(state: RoomState, highlights?: TacticalHighlights): void;
  playPresentationCues(
    cues: readonly VisualPresentationCue[],
    options: PresentationPlaybackOptions,
  ): void;
  clearPresentationCues(): void;
  rotateCamera(): CameraRotation;
  getCameraRotation(): CameraRotation;
  onCellSelected(listener: (position: GridPosition) => void): void;
  onHeroSelected(listener: (heroId: string) => void): void;
  onEnemySelected(listener: (enemyId: string) => void): void;
  onInteractableSelected(listener: (interactableId: string) => void): void;
}
