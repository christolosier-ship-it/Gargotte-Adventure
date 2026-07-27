import type { GridPosition, RoomState } from "@gargotte/engine";
import type { CameraRotation } from "./view";

export type PresentationTone = "info" | "warning" | "success" | "danger";

export type VisualCueKind =
  | "hero-activation"
  | "movement"
  | "impact"
  | "damage"
  | "brouhaha"
  | "threshold"
  | "reinforcement"
  | "terminal";

export interface VisualPresentationCue {
  id: string;
  sequence: number;
  kind: VisualCueKind;
  targetId: string | null;
  position: GridPosition | null;
  tone: PresentationTone;
  priority: number;
  durationMs: number;
  label: string;
}

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
