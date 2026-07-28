import { describe, expect, it } from "vitest";
import {
  attackTarget,
  createRoomState,
  finishEnemyTurn,
  type CreatureDefinition,
  type RoomState,
  type TacticalEvent,
} from "@gargotte/engine";
import {
  appendTerminalPhaseTransitionEvent,
  runTacticalResultPipeline,
} from "./tactical-result-pipeline";

const creatureDefinitions: CreatureDefinition[] = [
  {
    id: "gobelin-test",
    name: "Gobelin test",
    maxHp: 2,
    atk: 9,
    def: 0,
    range: 1,
    blocksMovement: true,
  },
];

const room = (phase: RoomState["phase"], turn = 3) =>
  ({ phase, turn }) as RoomState;

function playableRoom(): RoomState {
  const state = createRoomState({
    scenarioId: "pipeline-test",
    width: 4,
    height: 2,
    obstacles: [],
    spawnPoints: [],
    heroes: [
      {
        id: "brunhilda",
        name: "Brünhilda",
        position: { column: 0, row: 0 },
        hp: 10,
        maxHp: 10,
        atk: 9,
        def: 0,
        range: 2,
      },
    ],
    creatureDefinitions,
    enemies: [
      {
        id: "gobelin-1",
        creatureId: "gobelin-test",
        position: { column: 1, row: 0 },
      },
    ],
  });
  return { ...state, activeHeroId: "brunhilda" };
}

describe("pipeline des résultats tactiques", () => {
  it("dérive le cue terminal depuis une victoire réelle sans muter les événements", () => {
    const previous = playableRoom();
    const victory = attackTarget(previous, "brunhilda", "gobelin-1");
    if (!victory.ok) throw new Error("victoire attendue");
    const before = structuredClone(victory.value.events);

    const derived = appendTerminalPhaseTransitionEvent(
      previous,
      victory.value.state,
      victory.value.events,
    );

    expect(victory.value.state.phase).toBe("victory");
    expect(victory.value.events).toEqual(before);
    expect(derived.at(-1)).toEqual({
      type: "phase-changed",
      phase: "victory",
      turn: previous.turn,
    });
  });

  it("dérive le cue terminal depuis une défaite réelle", () => {
    const base = playableRoom();
    const previous: RoomState = {
      ...base,
      activeHeroId: null,
      phase: "enemy-turn",
      enemyTurnRoster: ["gobelin-1"],
      heroes: [{ ...base.heroes[0]!, hp: 1 }],
    };
    const defeat = finishEnemyTurn(previous);
    if (!defeat.ok) throw new Error("défaite attendue");

    const derived = appendTerminalPhaseTransitionEvent(
      previous,
      defeat.value.state,
      defeat.value.events,
    );

    expect(defeat.value.state.phase).toBe("defeat");
    expect(derived.at(-1)).toEqual({
      type: "phase-changed",
      phase: "defeat",
      turn: previous.turn,
    });
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
