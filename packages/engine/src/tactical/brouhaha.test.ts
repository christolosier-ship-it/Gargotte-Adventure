import { describe, expect, it } from "vitest";
import {
  changeBrouhaha,
  effectCountForBrouhahaLevel,
  selectEffects,
} from "./brouhaha";
import type {
  BrouhahaEffectDefinition,
  BrouhahaRequest,
  RoomState,
} from "./types";

const effects: BrouhahaEffectDefinition[] = [
  {
    id: "a-universel-bas",
    name: "A",
    description: "Effet A",
    scope: { type: "universal" },
    minLevel: 0,
    maxLevel: 9,
  },
  {
    id: "b-donjon-bas",
    name: "B",
    description: "Effet B",
    scope: { type: "dungeon", dungeonId: "bastognac" },
    minLevel: 0,
    maxLevel: 9,
  },
  {
    id: "c-universel-haut",
    name: "C",
    description: "Effet C",
    scope: { type: "universal" },
    minLevel: 10,
    maxLevel: 12,
  },
  {
    id: "d-universel-haut",
    name: "D",
    description: "Effet D",
    scope: { type: "universal" },
    minLevel: 10,
    maxLevel: 12,
  },
  {
    id: "e-donjon-haut",
    name: "E",
    description: "Effet E",
    scope: { type: "dungeon", dungeonId: "bastognac" },
    minLevel: 10,
    maxLevel: 12,
  },
];

const room = (level = 0): RoomState => ({
  version: 3,
  scenarioId: "test",
  width: 4,
  height: 4,
  obstacles: [],
  spawnPoints: [],
  processedSpawnRequestIds: [],
  nextEnemyInstanceSequence: 1,
  brouhaha: {
    level,
    processedRequestIds: [],
    nextResolutionSequence: 1,
    history: [],
  },
  heroes: [
    {
      id: "hero",
      name: "Héroïne",
      kind: "hero",
      position: { column: 0, row: 0 },
      hp: 5,
      maxHp: 5,
      atk: 2,
      def: 1,
      range: 1,
      alive: true,
      blocksMovement: true,
      actionsRemaining: 3,
      activationCompleted: false,
    },
  ],
  enemies: [
    {
      id: "enemy",
      creatureId: "enemy",
      name: "Ennemi",
      kind: "enemy",
      position: { column: 3, row: 3 },
      hp: 3,
      maxHp: 3,
      atk: 1,
      def: 0,
      range: 1,
      alive: true,
      blocksMovement: true,
    },
  ],
  activeHeroId: null,
  phase: "heroes-turn",
  turn: 1,
});

const request = (id: string, delta: number): BrouhahaRequest => ({
  id,
  delta,
  source: { type: "test", id: "vitest" },
  reason: "Contrôle automatique",
});

describe("Brouhaha déterministe", () => {
  it("applique une variation, un effet et un historique explicite", () => {
    const result = changeBrouhaha(room(), effects, request("r1", 1), {
      dungeonId: "bastognac",
    });

    expect(result.rejection).toBeNull();
    expect(result.state.brouhaha.level).toBe(1);
    expect(result.state.brouhaha.processedRequestIds).toEqual(["r1"]);
    expect(result.state.brouhaha.nextResolutionSequence).toBe(2);
    expect(result.state.brouhaha.history).toHaveLength(1);
    expect(result.state.brouhaha.history[0]).toMatchObject({
      previousLevel: 0,
      level: 1,
      requestedDelta: 1,
      appliedDelta: 1,
      effectIds: ["a-universel-bas"],
    });
    expect(result.events.map((event) => event.type)).toEqual([
      "brouhaha-change-requested",
      "brouhaha-level-changed",
      "brouhaha-effect-resolved",
    ]);
  });

  it("résout deux effets distincts aux niveaux 10 à 12", () => {
    const result = changeBrouhaha(room(9), effects, request("r10", 1), {
      dungeonId: "bastognac",
    });

    expect(effectCountForBrouhahaLevel(9)).toBe(1);
    expect(effectCountForBrouhahaLevel(10)).toBe(2);
    expect(result.effects.map((effect) => effect.id)).toEqual([
      "c-universel-haut",
      "d-universel-haut",
    ]);
    expect(new Set(result.effects.map((effect) => effect.id)).size).toBe(2);
    expect(result.state.brouhaha.history[0]!.effectIds).toHaveLength(2);
  });

  it("fait tourner le choix selon une séquence sauvegardable", () => {
    const sorted = effects.filter((effect) => effect.maxLevel === 9);
    expect(selectEffects(sorted, 1, 1)[0]!.id).toBe("a-universel-bas");
    expect(selectEffects(sorted, 1, 2)[0]!.id).toBe("b-donjon-bas");
    expect(selectEffects(sorted, 1, 3)[0]!.id).toBe("a-universel-bas");
  });

  it("borne la jauge et explique une variation partiellement appliquée", () => {
    const result = changeBrouhaha(room(11), effects, request("r12", 4), {
      dungeonId: "bastognac",
    });

    expect(result.state.brouhaha.level).toBe(12);
    expect(result.state.brouhaha.history[0]).toMatchObject({
      requestedDelta: 4,
      appliedDelta: 1,
    });
  });

  it("refuse sans mutation une demande dupliquée ou sans changement", () => {
    const first = changeBrouhaha(room(), effects, request("meme", 1), {
      dungeonId: "bastognac",
    });
    const duplicate = changeBrouhaha(first.state, effects, request("meme", 1), {
      dungeonId: "bastognac",
    });
    expect(duplicate.state).toBe(first.state);
    expect(duplicate.rejection?.reason).toBe("duplicate-request");

    const quietRoom = room();
    const floor = changeBrouhaha(quietRoom, effects, request("plancher", -2), {
      dungeonId: "bastognac",
    });
    expect(floor.state).toBe(quietRoom);
    expect(floor.state.brouhaha.level).toBe(0);
    expect(floor.rejection?.reason).toBe("no-level-change");
  });

  it("ignore les effets d'un autre donjon", () => {
    const otherDungeonEffect: BrouhahaEffectDefinition = {
      id: "autre-donjon",
      name: "Autre",
      description: "Ne doit pas sortir",
      scope: { type: "dungeon", dungeonId: "ailleurs" },
      minLevel: 0,
      maxLevel: 9,
    };
    const result = changeBrouhaha(
      room(),
      [...effects, otherDungeonEffect],
      request("scope", 1),
      { dungeonId: "bastognac" },
    );
    expect(result.effects.map((effect) => effect.id)).not.toContain(
      "autre-donjon",
    );
  });
});
