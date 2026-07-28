import { describe, expect, it } from "vitest";
import type { RoomState, TacticalEvent } from "@gargotte/engine";
import {
  appendTerminalPhaseTransitionEvent,
  runTacticalResultPipeline,
} from "./tactical-result-pipeline";

const room = (phase: RoomState["phase"], turn = 3) =>
  ({ phase, turn }) as RoomState;

describe("pipeline des résultats tactiques", () => {
  it("dérive un événement terminal sans muter les événements source", () => {
    const events: TacticalEvent[] = [
      { type: "combatant-defeated", combatantId: "gobelin-1" },
    ];
    const before = structuredClone(events);

    const derived = appendTerminalPhaseTransitionEvent(
      room("heroes-turn"),
      room("victory"),
      events,
    );

    expect(events).toEqual(before);
    expect(derived).toEqual([
      ...events,
      { type: "phase-changed", phase: "victory", turn: 3 },
    ]);
  });

  it("ne duplique pas une transition terminale déjà produite", () => {
    const events: TacticalEvent[] = [
      { type: "phase-changed", phase: "defeat", turn: 4 },
    ];

    expect(
      appendTerminalPhaseTransitionEvent(
        room("enemy-turn", 4),
        room("defeat", 4),
        events,
      ),
    ).toEqual(events);
  });

  it("exécute rendu, présentation puis persistance", () => {
    const calls: string[] = [];
    let presented: readonly TacticalEvent[] = [];

    runTacticalResultPipeline({
      previousRoom: room("enemy-turn", 5),
      nextRoom: room("defeat", 5),
      events: [{ type: "combatant-defeated", combatantId: "brunhilda" }],
      render: () => calls.push("render"),
      present: (events) => {
        calls.push("present");
        presented = events;
      },
      persist: () => calls.push("persist"),
    });

    expect(calls).toEqual(["render", "present", "persist"]);
    expect(presented.at(-1)).toEqual({
      type: "phase-changed",
      phase: "defeat",
      turn: 5,
    });
  });
});
