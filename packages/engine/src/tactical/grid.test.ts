import { describe, expect, it } from "vitest";
import { getOrthogonalNeighbors, isBlocked, isWithinBounds } from "./grid";
import { moveCombatant, reachablePositions, shortestPath } from "./movement";
import type { RoomState } from "./types";

const room = (): RoomState => ({
  version: 6,
  scenarioId: "t",
  width: 4,
  height: 4,
  obstacles: [{ column: 1, row: 1 }],
  interactables: [
    {
      id: "grille",
      interactableId: "grille-test",
      name: "Grille",
      kind: "gate",
      position: { column: 3, row: 1 },
      stateId: "fermee",
      blocksMovement: true,
      blocksLineOfSight: true,
    },
  ],
  processedInteractableRequestIds: [],
  nextInteractableInteractionSequence: 1,
  nextChainReactionSequence: 1,
  chainReactionHistory: [],
  spawnPoints: [],
  processedSpawnRequestIds: [],
  nextEnemyInstanceSequence: 1,
  brouhaha: {
    level: 0,
    processedRequestIds: [],
    nextResolutionSequence: 1,
    history: [],
  },
  nextBrouhahaReinforcementSequence: 1,
  brouhahaReinforcementHistory: [],
  heroes: [
    {
      id: "h",
      name: "H",
      kind: "hero",
      position: { column: 0, row: 0 },
      hp: 5,
      maxHp: 5,
      atk: 2,
      def: 0,
      range: 1,
      alive: true,
      blocksMovement: true,
      actionsRemaining: 3,
      activationCompleted: false,
    },
  ],
  enemies: [
    {
      id: "e",
      creatureId: "enemy-test",
      name: "E",
      kind: "enemy",
      position: { column: 2, row: 0 },
      hp: 3,
      maxHp: 3,
      atk: 1,
      def: 0,
      range: 1,
      alive: true,
      blocksMovement: true,
    },
  ],
  activeHeroId: "h",
  phase: "heroes-turn",
  turn: 1,
});

describe("grille tactique", () => {
  it("rejette sortie obstacle objet et occupation", () => {
    const state = room();
    expect(isWithinBounds({ column: -1, row: 0 }, 4, 4)).toBe(false);
    expect(isBlocked(state, { column: 1, row: 1 })).toBe(true);
    expect(isBlocked(state, { column: 2, row: 0 })).toBe(true);
    expect(isBlocked(state, { column: 3, row: 1 })).toBe(true);
  });

  it("liste voisins dans un coin", () => {
    expect(getOrthogonalNeighbors({ column: 0, row: 0 }, 4, 4)).toEqual([
      { column: 1, row: 0 },
      { column: 0, row: 1 },
    ]);
  });

  it("calcule atteignables et chemin impossible", () => {
    const state = room();
    expect(
      reachablePositions(state, state.heroes[0]!.position, 2, "h"),
    ).toContainEqual({ column: 0, row: 2 });
    expect(
      shortestPath(
        state,
        state.heroes[0]!.position,
        { column: 2, row: 0 },
        "h",
      ),
    ).toBeNull();
  });

  it("départage les chemins équivalents", () => {
    const state = { ...room(), obstacles: [], interactables: [], enemies: [] };
    expect(
      shortestPath(state, { column: 0, row: 0 }, { column: 1, row: 1 }, "h"),
    ).toEqual([
      { column: 1, row: 0 },
      { column: 1, row: 1 },
    ]);
  });

  it("déplace une ou plusieurs cases avec un événement par action", () => {
    const state = { ...room(), obstacles: [], interactables: [], enemies: [] };
    const one = moveCombatant(state, "h", { column: 1, row: 0 });
    expect(one.ok && one.value.events).toHaveLength(1);
    const many = moveCombatant(state, "h", { column: 0, row: 3 });
    expect(many.ok && many.value.events).toHaveLength(3);
    expect(many.ok && many.value.state.heroes[0]!.actionsRemaining).toBe(0);
  });
});
