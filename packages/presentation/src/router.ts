import type { TacticalEvent } from "@gargotte/engine";
import type {
  AudioCueKey,
  AudioPresentationCue,
  JournalPresentationEntry,
  PresentationBatch,
  PresentationRoutingOptions,
  PresentationTone,
  VisualPresentationCue,
} from "./types";

const defaultMaxVisualCues = 10;
const defaultMaxAudioCues = 6;

export function routeTacticalPresentation(
  events: readonly TacticalEvent[],
  describe: (event: TacticalEvent) => string,
  options: PresentationRoutingOptions = {},
): PresentationBatch {
  const rootId = resolveRootId(events);
  const reducedMotion = options.reducedMotion ?? false;
  const visualCues: VisualPresentationCue[] = [];
  const audioCues: AudioPresentationCue[] = [];

  for (const [eventIndex, event] of events.entries()) {
    const label = describe(event);
    const baseSequence = eventIndex * 10;
    visualCues.push(
      ...visualCuesFor(event, label, rootId, baseSequence, reducedMotion),
    );
    audioCues.push(...audioCuesFor(event, rootId, baseSequence));
  }

  return {
    rootId,
    visualCues: visualCues.slice(
      0,
      options.maxVisualCues ?? defaultMaxVisualCues,
    ),
    audioCues: audioCues.slice(0, options.maxAudioCues ?? defaultMaxAudioCues),
    journal: journalEntry(events, describe, rootId),
  };
}

function resolveRootId(events: readonly TacticalEvent[]): string {
  for (const [index, event] of events.entries()) {
    const candidate = rootIdForEvent(event);
    if (candidate) return candidate;
    if (index === events.length - 1) return `action-${index + 1}`;
  }
  return "action-empty";
}

function rootIdForEvent(event: TacticalEvent): string | null {
  switch (event.type) {
    case "interactable-interaction-requested":
    case "interactable-state-changed":
    case "interactable-moved":
    case "interactable-interaction-succeeded":
    case "interactable-interaction-rejected":
      return event.requestId;
    case "chain-reaction-triggered":
      return event.rootRequestId;
    case "reinforcement-triggered":
    case "reinforcement-resolved":
      return event.brouhahaRequestId;
    case "spawn-requested":
    case "creature-instantiated":
    case "spawn-succeeded":
    case "spawn-rejected":
    case "brouhaha-change-requested":
    case "brouhaha-level-changed":
    case "brouhaha-effect-resolved":
    case "brouhaha-change-rejected":
      return event.requestId;
    default:
      return null;
  }
}

function visualCuesFor(
  event: TacticalEvent,
  label: string,
  rootId: string,
  sequence: number,
  reducedMotion: boolean,
): VisualPresentationCue[] {
  const durationMs = reducedMotion ? 70 : 420;
  const cue = (
    kind: VisualPresentationCue["kind"],
    targetId: string | null,
    tone: PresentationTone,
    priority: number,
    position: VisualPresentationCue["position"] = null,
    offset = 0,
  ): VisualPresentationCue => ({
    id: `visual-${rootId}-${sequence + offset}-${kind}`,
    sequence: sequence + offset,
    kind,
    targetId,
    position,
    tone,
    priority,
    durationMs,
    label,
  });

  switch (event.type) {
    case "hero-selected":
      return [cue("hero-activation", event.heroId, "info", 30)];
    case "combatant-moved":
      return [cue("movement", event.combatantId, "info", 35, { ...event.to })];
    case "combatant-attacked":
      return [
        cue("impact", event.targetId, "warning", 60),
        cue("damage", event.targetId, "danger", 70, null, 1),
      ];
    case "combatant-defeated":
      return [cue("damage", event.combatantId, "danger", 80)];
    case "interactable-state-changed":
      return [cue("impact", event.interactableInstanceId, "warning", 55)];
    case "interactable-moved":
      return [
        cue(
          "movement",
          event.interactableInstanceId,
          "info",
          40,
          { ...event.to },
        ),
      ];
    case "chain-reaction-triggered":
      return [cue("impact", event.sourceInstanceId, "warning", 65)];
    case "chain-reaction-damage-applied":
      return [cue("damage", event.combatantId, "danger", 75)];
    case "brouhaha-level-changed":
      return [
        cue(
          "brouhaha",
          null,
          event.appliedDelta > 0 ? "warning" : "info",
          50,
        ),
      ];
    case "reinforcement-triggered":
      return [cue("threshold", null, "warning", 75)];
    case "creature-instantiated":
      return [
        cue(
          "reinforcement",
          event.instanceId,
          "success",
          80,
          { ...event.position },
        ),
      ];
    case "reinforcement-resolved":
      return [
        cue(
          "reinforcement",
          event.createdInstanceIds[0] ?? null,
          event.result === "rejected"
            ? "danger"
            : event.result === "partial"
              ? "warning"
              : "success",
          85,
        ),
      ];
    case "spawn-rejected":
      return [cue("reinforcement", null, "danger", 80)];
    case "phase-changed":
      return event.phase === "victory" || event.phase === "defeat"
        ? [
            cue(
              "terminal",
              null,
              event.phase === "victory" ? "success" : "danger",
              100,
            ),
          ]
        : [];
    default:
      return [];
  }
}

function audioCuesFor(
  event: TacticalEvent,
  rootId: string,
  sequence: number,
): AudioPresentationCue[] {
  const cue = (
    key: AudioCueKey,
    priority: number,
    offset = 0,
  ): AudioPresentationCue => ({
    id: `audio-${rootId}-${sequence + offset}-${key}`,
    sequence: sequence + offset,
    key,
    priority,
  });

  switch (event.type) {
    case "combatant-attacked":
      return [cue("impact", 60), cue("damage", 70, 1)];
    case "interactable-state-changed":
    case "interactable-moved":
    case "interactable-interaction-succeeded":
      return [cue("interaction", 45)];
    case "chain-reaction-triggered":
      return [cue("impact", 65)];
    case "chain-reaction-damage-applied":
      return [cue("damage", 75)];
    case "brouhaha-level-changed":
      return event.appliedDelta > 0 ? [cue("brouhaha", 55)] : [];
    case "reinforcement-resolved":
      return event.result === "rejected" ? [] : [cue("reinforcement", 85)];
    case "phase-changed":
      return event.phase === "victory"
        ? [cue("victory", 100)]
        : event.phase === "defeat"
          ? [cue("defeat", 100)]
          : [];
    default:
      return [];
  }
}

function journalEntry(
  events: readonly TacticalEvent[],
  describe: (event: TacticalEvent) => string,
  rootId: string,
): JournalPresentationEntry {
  const messages = unique(events.map(describe).filter(Boolean));
  const primary = [...events]
    .map((event, index) => ({ event, index, priority: journalPriority(event) }))
    .sort((left, right) => right.priority - left.priority || left.index - right.index)[0]
    ?.event;
  const summary = primary ? describe(primary) : "Action tactique résolue.";

  return {
    id: `journal-${rootId}`,
    rootId,
    summary,
    details: messages.filter((message) => message !== summary).slice(0, 7),
    tone: primary ? journalTone(primary) : "info",
    eventTypes: unique(events.map((event) => event.type)),
  };
}

function journalPriority(event: TacticalEvent): number {
  switch (event.type) {
    case "phase-changed":
      return event.phase === "victory" || event.phase === "defeat" ? 100 : 20;
    case "reinforcement-resolved":
      return 90;
    case "spawn-rejected":
      return 85;
    case "brouhaha-level-changed":
      return 80;
    case "chain-reaction-damage-applied":
      return 75;
    case "combatant-defeated":
      return 70;
    case "combatant-attacked":
      return 65;
    case "interactable-state-changed":
      return 60;
    case "combatant-moved":
    case "interactable-moved":
      return 50;
    case "hero-selected":
      return 40;
    default:
      return 10;
  }
}

function journalTone(event: TacticalEvent): PresentationTone {
  switch (event.type) {
    case "phase-changed":
      return event.phase === "victory"
        ? "success"
        : event.phase === "defeat"
          ? "danger"
          : "info";
    case "spawn-rejected":
    case "brouhaha-change-rejected":
    case "interactable-interaction-rejected":
      return "danger";
    case "reinforcement-resolved":
      return event.result === "succeeded"
        ? "success"
        : event.result === "partial"
          ? "warning"
          : "danger";
    case "brouhaha-level-changed":
      return event.appliedDelta > 0 ? "warning" : "info";
    case "combatant-attacked":
    case "combatant-defeated":
    case "chain-reaction-damage-applied":
      return "danger";
    default:
      return "info";
  }
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
