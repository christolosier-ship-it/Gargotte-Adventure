import { describe, expect, it } from "vitest";
import type { TacticalEvent } from "@gargotte/engine";
import { routeTacticalPresentation } from "./router";

const describeEvent = (event: TacticalEvent) => `message:${event.type}`;

describe("routeur de présentation", () => {
  it("préserve l'ordre causal sans muter les événements", () => {
    const events: TacticalEvent[] = [
      {
        type: "combatant-moved",
        combatantId: "brunhilda",
        from: { column: 0, row: 0 },
        to: { column: 1, row: 0 },
        actionCost: 1,
      },
      {
        type: "combatant-attacked",
        attackerId: "brunhilda",
        targetId: "gobelin-1",
        damage: 2,
        remainingHp: 1,
      },
      {
        type: "brouhaha-level-changed",
        requestId: "bruit-1",
        previousLevel: 0,
        level: 1,
        requestedDelta: 1,
        appliedDelta: 1,
        reason: "impact",
      },
      {
        type: "reinforcement-resolved",
        reinforcementId: "renfort-1",
        reinforcementDefinitionId: "seuil-1",
        brouhahaRequestId: "bruit-1",
        threshold: 1,
        activation: 1,
        spawnRequestId: "spawn-1",
        result: "succeeded",
        createdInstanceIds: ["gobelin-2"],
        details: [],
      },
      { type: "phase-changed", phase: "victory", turn: 1 },
    ];
    const before = structuredClone(events);

    const batch = routeTacticalPresentation(events, describeEvent);

    expect(events).toEqual(before);
    expect(batch.rootId).toBe("bruit-1");
    expect(batch.visualCues.map((cue) => cue.kind)).toEqual([
      "movement",
      "impact",
      "damage",
      "brouhaha",
      "reinforcement",
      "terminal",
    ]);
    expect(batch.visualCues.map((cue) => cue.sequence)).toEqual([
      0, 10, 11, 20, 30, 40,
    ]);
    expect(batch.audioCues.map((cue) => cue.key)).toEqual([
      "impact",
      "damage",
      "brouhaha",
      "reinforcement",
      "victory",
    ]);
    expect(batch.journal.summary).toBe("message:phase-changed");
    expect(batch.journal.tone).toBe("success");
  });

  it("regroupe une action racine et borne les sorties", () => {
    const events: TacticalEvent[] = [
      {
        type: "interactable-interaction-requested",
        requestId: "interaction-1",
        heroId: "brunhilda",
        interactableInstanceId: "tonneau-1",
        interactionId: "briser",
      },
      {
        type: "interactable-state-changed",
        requestId: "interaction-1",
        interactableInstanceId: "tonneau-1",
        interactableId: "tonneau",
        kind: "barrel",
        previousStateId: "intact",
        stateId: "brise",
        cause: { type: "hero-interaction", id: "interaction-1" },
      },
      {
        type: "brouhaha-level-changed",
        requestId: "bruit-2",
        previousLevel: 1,
        level: 2,
        requestedDelta: 1,
        appliedDelta: 1,
        reason: "tonneau",
      },
    ];

    const batch = routeTacticalPresentation(events, describeEvent, {
      maxVisualCues: 1,
      maxAudioCues: 1,
    });

    expect(batch.rootId).toBe("interaction-1");
    expect(batch.visualCues).toHaveLength(1);
    expect(batch.audioCues).toHaveLength(1);
    expect(batch.journal.eventTypes).toEqual([
      "interactable-interaction-requested",
      "interactable-state-changed",
      "brouhaha-level-changed",
    ]);
  });

  it("réduit fortement la durée des cues en mouvement réduit", () => {
    const events: TacticalEvent[] = [
      { type: "hero-selected", heroId: "brunhilda" },
    ];

    const batch = routeTacticalPresentation(events, describeEvent, {
      reducedMotion: true,
    });

    expect(batch.visualCues[0]?.durationMs).toBeLessThanOrEqual(70);
  });
});
