import type { GridPosition } from "@gargotte/engine";

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

export type AudioCueKey =
  | "interaction"
  | "impact"
  | "damage"
  | "brouhaha"
  | "reinforcement"
  | "victory"
  | "defeat";

export interface AudioPresentationCue {
  id: string;
  sequence: number;
  key: AudioCueKey;
  priority: number;
}

export interface JournalPresentationEntry {
  id: string;
  rootId: string;
  summary: string;
  details: string[];
  tone: PresentationTone;
  eventTypes: string[];
}

export interface PresentationBatch {
  rootId: string;
  visualCues: VisualPresentationCue[];
  audioCues: AudioPresentationCue[];
  journal: JournalPresentationEntry;
}

export interface PresentationRoutingOptions {
  reducedMotion?: boolean;
  maxVisualCues?: number;
  maxAudioCues?: number;
}
