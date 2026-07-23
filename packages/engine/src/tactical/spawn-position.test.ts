import { describe, expect, it } from "vitest";
import { createRoomState } from "./room-state";
import { spawnCreatures } from "./spawn";
import type { CreatureDefinition } from "./types";

const creature: CreatureDefinition = {
  id: "gobelin-test",
  name: "Gobelin Test",
  maxHp: 4,
  atk: 1,
  def: 0,
  range: 1,
  blocksMovement: true,
};

describe("positions de spawn", () => {
  it("ne crée jamais deux instances sur une même position", () => {
    const room = createRoomState({
      scenarioId: "duplicate-position",
      width: 4,
      height: 3,
      obstacles: [],
      spawnPoints: [
        {
          id: "porte-a",
          position: { column: 3, row: 1 },
          tags: ["reinforcement"],
          enabled: true,
        },
        {
          id: "porte-b",
          position: { column: 3, row: 1 },
          tags: ["reinforcement"],
          enabled: true,
        },
      ],
      heroes: [
        {
          id: "hero",
          name: "Héroïne",
          position: { column: 0, row: 1 },
          hp: 8,
          maxHp: 8,
          atk: 2,
          def: 1,
          range: 1,
        },
      ],
      creatureDefinitions: [creature],
      enemies: [
        {
          id: "ennemi-initial",
          creatureId: creature.id,
          position: { column: 2, row: 0 },
        },
      ],
    });

    const result = spawnCreatures(room, [creature], {
      id: "renfort-double-position",
      source: { type: "test", id: "duplicate-position" },
      creatureId: creature.id,
      quantity: 2,
      candidateSpawnPointIds: ["porte-a", "porte-b"],
      failureMode: "all-or-nothing",
    });

    expect(result.state).toBe(room);
    expect(result.created).toEqual([]);
    expect(result.rejected[0]).toMatchObject({
      reason: "not-enough-valid-points",
      available: 1,
      requested: 2,
    });
    expect(result.rejected[0]?.details).toContain(
      "porte-b: position déjà retenue par un autre point",
    );
  });
});
