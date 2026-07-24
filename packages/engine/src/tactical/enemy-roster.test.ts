import { describe, expect, it } from "vitest";
import { createEnemyTurnRoster, runEnemyTurn } from "./enemy-ai";
import { createRoomState } from "./room-state";
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
  it("ignore jusqu'au prochain tour un ennemi ajouté après l'ouverture", () => {
    const current = { ...room(), phase: "enemy-turn" as const };
    const roster = createEnemyTurnRoster(current);
    const withLateReinforcement = {
      ...current,
      enemies: [
        ...current.enemies,
        {
          ...current.enemies[0]!,
          id: "renfort-tardif",
          position: { column: 4, row: 2 },
        },
      ],
    };

    const currentTurn = runEnemyTurn(withLateReinforcement, roster);
    expect(
      currentTurn.events
        .filter((event) => event.type === "enemy-decision")
        .map((event) => event.enemyId),
    ).toEqual(["ancien"]);

    const nextTurn = runEnemyTurn(withLateReinforcement);
    expect(
      nextTurn.events
        .filter((event) => event.type === "enemy-decision")
        .map((event) => event.enemyId),
    ).toEqual(["ancien", "renfort-tardif"]);
  });
});
