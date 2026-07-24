import { describe, expect, it } from "vitest";
import { runEnemyTurn } from "./enemy-ai";
import { createRoomState } from "./room-state";
import { endHeroesTurn, finishEnemyTurn } from "./turn-machine";
import type { CreatureDefinition } from "./types";

const creature: CreatureDefinition = {
  id: "gobelin",
  name: "Gobelin",
  maxHp: 4,
  atk: 2,
  def: 0,
  range: 1,
  blocksMovement: true,
};

const room = () =>
  createRoomState({
    scenarioId: "salle-test",
    width: 6,
    height: 3,
    obstacles: [],
    spawnPoints: [],
    heroes: [
      {
        id: "hero",
        name: "Héroïne",
        position: { column: 0, row: 1 },
        hp: 10,
        maxHp: 10,
        atk: 3,
        def: 0,
        range: 1,
      },
    ],
    creatureDefinitions: [creature],
    enemies: [
      {
        id: "ancien",
        creatureId: creature.id,
        position: { column: 4, row: 0 },
      },
    ],
  });

describe("roster du tour ennemi", () => {
  it("conserve un roster vivant pour un appel direct sans roster prérempli", () => {
    const direct = runEnemyTurn({
      ...room(),
      phase: "enemy-turn",
      enemyTurnRoster: [],
    });

    expect(
      direct.events
        .filter((event) => event.type === "enemy-decision")
        .map((event) => event.enemyId),
    ).toEqual(["ancien"]);
  });

  it("ignore jusqu'au prochain tour un ennemi ajouté après l'ouverture", () => {
    const opened = endHeroesTurn(room());
    expect(opened.ok).toBe(true);
    if (!opened.ok) throw new Error("ouverture du tour ennemi attendue");
    expect(opened.value.state.enemyTurnRoster).toEqual(["ancien"]);

    const withLateReinforcement = {
      ...opened.value.state,
      enemies: [
        ...opened.value.state.enemies,
        {
          ...opened.value.state.enemies[0]!,
          id: "renfort-tardif",
          position: { column: 4, row: 2 },
        },
      ],
    };

    const currentTurn = finishEnemyTurn(withLateReinforcement);
    expect(currentTurn.ok).toBe(true);
    if (!currentTurn.ok) throw new Error("résolution du tour ennemi attendue");
    expect(
      currentTurn.value.events
        .filter((event) => event.type === "enemy-decision")
        .map((event) => event.enemyId),
    ).toEqual(["ancien"]);
    expect(currentTurn.value.state.enemyTurnRoster).toEqual([]);

    const nextOpened = endHeroesTurn(currentTurn.value.state);
    expect(nextOpened.ok).toBe(true);
    if (!nextOpened.ok) throw new Error("tour ennemi suivant attendu");
    expect(nextOpened.value.state.enemyTurnRoster).toEqual([
      "ancien",
      "renfort-tardif",
    ]);

    const nextTurn = finishEnemyTurn(nextOpened.value.state);
    expect(nextTurn.ok).toBe(true);
    if (!nextTurn.ok) throw new Error("résolution suivante attendue");
    expect(
      nextTurn.value.events
        .filter((event) => event.type === "enemy-decision")
        .map((event) => event.enemyId),
    ).toEqual(["ancien", "renfort-tardif"]);
  });
});
