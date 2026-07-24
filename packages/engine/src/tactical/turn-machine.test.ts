import { describe, expect, it } from "vitest";
import { attackTarget } from "./combat";
import { chooseEnemyDecision, runEnemyTurn } from "./enemy-ai";
import { createRoomState } from "./room-state";
import {
  endHeroActivation,
  endHeroesTurn,
  finishEnemyTurn,
  selectHero,
} from "./turn-machine";
import type { CreatureDefinition } from "./types";

const creatureDefinitions: CreatureDefinition[] = [
  {
    id: "enemy-melee",
    name: "E1",
    maxHp: 4,
    atk: 2,
    def: 0,
    range: 1,
    blocksMovement: true,
  },
  {
    id: "enemy-ranged",
    name: "E2",
    maxHp: 4,
    atk: 2,
    def: 0,
    range: 3,
    blocksMovement: true,
  },
];

const room = () =>
  createRoomState({
    scenarioId: "s",
    width: 8,
    height: 4,
    obstacles: [],
    spawnPoints: [],
    heroes: [
      {
        id: "a",
        name: "A",
        position: { column: 0, row: 0 },
        hp: 10,
        maxHp: 10,
        atk: 3,
        def: 0,
        range: 1,
      },
      {
        id: "b",
        name: "B",
        position: { column: 0, row: 3 },
        hp: 10,
        maxHp: 10,
        atk: 3,
        def: 0,
        range: 3,
      },
    ],
    creatureDefinitions,
    enemies: [
      {
        id: "e1",
        creatureId: "enemy-melee",
        position: { column: 3, row: 0 },
      },
      {
        id: "e2",
        creatureId: "enemy-ranged",
        position: { column: 6, row: 3 },
      },
    ],
  });

describe("tours et ia", () => {
  it("sélectionne dans un ordre libre et interdit le changement en activation", () => {
    const selected = selectHero(room(), "b");
    expect(selected.ok).toBe(true);
    expect(selected.ok && selected.value.state.activeHeroId).toBe("b");
    expect(selected.ok && selectHero(selected.value.state, "a").ok).toBe(false);
  });

  it("gère la fin anticipée et un héros déjà terminé", () => {
    const selected = selectHero(room(), "b");
    if (!selected.ok) throw new Error("sélection attendue");
    const ended = endHeroActivation(selected.value.state, "b");
    expect(ended.ok).toBe(true);
    if (!ended.ok) throw new Error("fin attendue");
    expect(
      ended.value.state.heroes.find((hero) => hero.id === "b")
        ?.activationCompleted,
    ).toBe(true);
    expect(ended.value.state.enemyTurnRoster).toEqual([]);
    expect(selectHero(ended.value.state, "b").ok).toBe(false);
  });

  it("refuse de résoudre les ennemis avant leur phase", () => {
    const result = finishEnemyTurn(room());
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe("not-enemy-turn");
  });

  it("termine volontairement les héros puis restaure leurs actions", () => {
    const ended = endHeroesTurn(room());
    expect(ended.ok).toBe(true);
    if (!ended.ok) throw new Error("fin du tour attendue");
    expect(ended.value.state.phase).toBe("enemy-turn");
    expect(ended.value.state.enemyTurnRoster).toEqual(["e1", "e2"]);
    const resolved = finishEnemyTurn(ended.value.state);
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) throw new Error("résolution attendue");
    expect(resolved.value.state.phase).toBe("heroes-turn");
    expect(resolved.value.state.turn).toBe(2);
    expect(resolved.value.state.enemyTurnRoster).toEqual([]);
    expect(
      resolved.value.state.heroes.every(
        (hero) => hero.actionsRemaining === 3 && !hero.activationCompleted,
      ),
    ).toBe(true);
  });

  it("fait avancer la mêlée et attaquer la distance", () => {
    const current = room();
    expect(
      runEnemyTurn(current).events.some(
        (event) => event.type === "combatant-moved",
      ),
    ).toBe(true);
    const ranged = {
      ...current,
      enemies: [{ ...current.enemies[1]!, position: { column: 0, row: 1 } }],
    };
    expect(
      runEnemyTurn(ranged).events.some(
        (event) => event.type === "combatant-attacked",
      ),
    ).toBe(true);
  });

  it("déplace un tireur lorsque la cible en portée est masquée", () => {
    const current = {
      ...room(),
      obstacles: [{ column: 0, row: 1 }],
      heroes: [room().heroes[0]!],
      enemies: [
        {
          ...room().enemies[1]!,
          position: { column: 0, row: 2 },
          range: 3,
        },
      ],
    };
    const decision = chooseEnemyDecision(current, "e2");
    expect(decision.action).toBe("move");
    expect(decision.reason).toContain("visible");
  });

  it("gère une cible inaccessible et reste déterministe", () => {
    const current = room();
    const blocked = {
      ...current,
      obstacles: [
        { column: 1, row: 0 },
        { column: 0, row: 1 },
      ],
      enemies: [current.enemies[0]!],
      heroes: [current.heroes[0]!],
    };
    expect(
      runEnemyTurn(blocked).events.find(
        (event) => event.type === "enemy-decision",
      )?.explanation.reason,
    ).toContain("inaccessible");
    expect(runEnemyTurn(current)).toEqual(runEnemyTurn(current));
  });

  it("déclenche exactement la victoire et la défaite", () => {
    const selected = selectHero(room(), "b");
    if (!selected.ok) throw new Error("sélection attendue");
    const victory = attackTarget(
      {
        ...selected.value.state,
        heroes: [
          {
            ...selected.value.state.heroes[1]!,
            atk: 9,
            range: 8,
          },
        ],
        enemies: [selected.value.state.enemies[0]!],
      },
      "b",
      "e1",
    );
    expect(victory.ok).toBe(true);
    if (!victory.ok) throw new Error("victoire attendue");
    expect(victory.value.state.phase).toBe("victory");
    expect(victory.value.state.enemyTurnRoster).toEqual([]);

    const defeatInput = {
      ...room(),
      heroes: [{ ...room().heroes[0]!, hp: 1 }],
      enemies: [
        { ...room().enemies[0]!, position: { column: 1, row: 0 }, atk: 9 },
      ],
      enemyTurnRoster: ["e1"],
      phase: "enemy-turn" as const,
    };
    const defeat = finishEnemyTurn(defeatInput);
    expect(defeat.ok).toBe(true);
    if (!defeat.ok) throw new Error("défaite attendue");
    expect(defeat.value.state.phase).toBe("defeat");
    expect(defeat.value.state.enemyTurnRoster).toEqual([]);
  });
});
