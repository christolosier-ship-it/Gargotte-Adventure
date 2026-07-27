import { Graphics, type Container } from "pixi.js";
import type { GridPosition, RoomState } from "@gargotte/engine";
import type { VisualPresentationCue } from "@gargotte/presentation";
import type { ScreenPosition } from "./projection";

export interface PresentationLayerDiagnostics {
  generation: number;
  total: number;
  active: number;
  reducedMotion: boolean;
}

interface PresentationLayerOptions {
  layer: Container;
  project(position: GridPosition): ScreenPosition;
  updateDiagnostics(diagnostics: PresentationLayerDiagnostics): void;
}

export class PresentationLayerController {
  readonly #layer: Container;
  readonly #project: PresentationLayerOptions["project"];
  readonly #updateDiagnostics: PresentationLayerOptions["updateDiagnostics"];
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();
  #generation = 0;
  #total = 0;
  #reducedMotion = false;

  constructor(options: PresentationLayerOptions) {
    this.#layer = options.layer;
    this.#project = options.project;
    this.#updateDiagnostics = options.updateDiagnostics;
  }

  play(
    cues: readonly VisualPresentationCue[],
    state: RoomState,
    reducedMotion: boolean,
  ): void {
    this.clear();
    this.#generation += 1;
    this.#total = cues.length;
    this.#reducedMotion = reducedMotion;
    const generation = this.#generation;
    this.report();

    cues.forEach((cue, index) => {
      const delay = reducedMotion ? 0 : Math.min(index * 90, 540);
      this.schedule(() => {
        if (generation !== this.#generation) return;
        this.showCue(cue, state, generation);
      }, delay);
    });
  }

  clear(): void {
    this.#generation += 1;
    for (const timer of this.#timers) clearTimeout(timer);
    this.#timers.clear();
    for (const child of this.#layer.removeChildren())
      child.destroy({ children: true });
    this.#total = 0;
    this.report();
  }

  private showCue(
    cue: VisualPresentationCue,
    state: RoomState,
    generation: number,
  ): void {
    const position = resolveCuePosition(cue, state);
    const screen = this.#project(position);
    const radius = cue.kind === "terminal" ? 78 : cue.kind === "brouhaha" ? 58 : 36;
    const ring = new Graphics()
      .circle(0, -18, radius)
      .stroke({
        color: toneColor(cue.tone),
        width: cue.kind === "terminal" ? 8 : 5,
        alpha: 0.92,
      });
    ring.eventMode = "none";
    ring.label = `presentation:${cue.kind}:${cue.id}`;
    ring.zIndex = 100_000 + cue.priority;
    ring.position.set(screen.x, screen.y);
    this.#layer.addChild(ring);
    this.report();

    this.schedule(() => {
      if (generation !== this.#generation || ring.destroyed) return;
      this.#layer.removeChild(ring);
      ring.destroy();
      this.report();
    }, cue.durationMs);
  }

  private schedule(action: () => void, delay: number): void {
    const timer = setTimeout(() => {
      this.#timers.delete(timer);
      action();
    }, delay);
    this.#timers.add(timer);
  }

  private report(): void {
    this.#updateDiagnostics({
      generation: this.#generation,
      total: this.#total,
      active: this.#layer.children.length,
      reducedMotion: this.#reducedMotion,
    });
  }
}

function resolveCuePosition(
  cue: VisualPresentationCue,
  state: RoomState,
): GridPosition {
  if (cue.position) return cue.position;
  if (cue.targetId) {
    const combatant = [...state.heroes, ...state.enemies].find(
      (candidate) => candidate.id === cue.targetId,
    );
    if (combatant) return combatant.position;
    const interactable = state.interactables.find(
      (candidate) => candidate.id === cue.targetId,
    );
    if (interactable) return interactable.position;
  }
  return {
    column: Math.floor((state.width - 1) / 2),
    row: Math.floor((state.height - 1) / 2),
  };
}

function toneColor(tone: VisualPresentationCue["tone"]): number {
  switch (tone) {
    case "success":
      return 0x7fbd76;
    case "warning":
      return 0xf1c86f;
    case "danger":
      return 0xd45f57;
    case "info":
      return 0x8ecae6;
  }
}
