import { describe, expect, it } from "vitest";
import { createRoomState } from "./room-state";
import { spawnCreatures } from "./spawn";
import type { CreatureDefinition, SpawnRequest } from "./types";

const creature: CreatureDefinition = {
  id: "gobelin-bricoleur",
  name: "Gobelin Bricoleur",
  maxHp: 6,
  atk: 2,
  def: 0,
  range: 1,
  blocksMovement: true,
};

const request = (overrides: Partial<SpawnRequest> = {}): SpawnRequest => ({
  id: "renfort-1",
  source: { type: "test", id: "spawn-test" },
  creatureId: creature.id,
  quantity: 1,
  candidateSpawnPointIds: ["est-haut", "est-bas"],
  failureMode: "all-or-nothing",
  ...overrides,
});

const room = () =>
  createRoomState({
    scenarioId: "salle-test",
    width: 5,
    height: 3,
    obstacles: [{ column: 2, row: 1 }],
    spawnPoints: [
      {
        id: "est-haut",
        position: { column: 4, row: 0 },
        tags: ["reinforcement"],
        enabled: true,
      },
      {
        id: "est-bas",
        position: { column: 4, row: 2 },
        tags: ["reinforcement"],
        enabled: true,
      },
      {
        id: "desactive",
        position: { column: 3, row: 2 },
        tags: ["reinforcement"],
        enabled: false,
      },
    ],
    heroes: [
      {
        id: "hero",
        name: "Héroïne",
        position: { column: 0, row: 1 },
        hp: 10,
        maxHp: 10,
        atk: 3,
        def: 1,
        range: 1,
      },
    ],
    creatureDefinitions: [creature],
    enemies: [
      {
        id: "gobelin-bricoleur-initial-1",
        creatureId: creature.id,
        position: { column: 3, row: 0 },
      },
    ],
  });

describe("moteur de spawn déterministe", () => {
  it("crée plusieurs instances d'un même archétype dans l'ordre demandé", () => {
    const result = spawnCreatures(room(), [creature], request({ quantity: 2 }));

    expect(result.created.map((instance) => instance.id)).toEqual([
      "gobelin-bricoleur-spawn-1",
      "gobelin-bricoleur-spawn-2",
    ]);
    expect(result.created.map((instance) => instance.creatureId)).toEqual([
      creature.id,
      creature.id,
    ]);
    expect(result.created.map((instance) => instance.position)).toEqual([
      { column: 4, row: 0 },
      { column: 4, row: 2 },
    ]);
    expect(result.state.nextEnemyInstanceSequence).toBe(3);
    expect(result.state.processedSpawnRequestIds).toEqual(["renfort-1"]);
    expect(result.events.map((event) => event.type)).toEqual([
      "spawn-requested",
      "creature-instantiated",
      "creature-instantiated",
      "spawn-succeeded",
    ]);
  });

  it("retourne exactement le même résultat pour les mêmes entrées", () => {
    const current = room();
    const spawnRequest = request({ quantity: 2 });
    expect(spawnCreatures(current, [creature], spawnRequest)).toEqual(
      spawnCreatures(current, [creature], spawnRequest),
    );
  });

  it("sélectionne le premier point libre sans réordonner les candidats", () => {
    const current = {
      ...room(),
      heroes: [
        {
          ...room().heroes[0]!,
          position: { column: 4, row: 0 },
        },
      ],
    };
    const result = spawnCreatures(current, [creature], request());
    expect(result.created[0]?.position).toEqual({ column: 4, row: 2 });
    expect(result.rejected).toEqual([]);
  });

  it("ne modifie pas la salle lorsque le mode total manque de points", () => {
    const current = room();
    const result = spawnCreatures(
      current,
      [creature],
      request({
        quantity: 2,
        candidateSpawnPointIds: ["est-haut", "desactive", "absent"],
      }),
    );
    expect(result.state).toBe(current);
    expect(result.created).toEqual([]);
    expect(result.rejected[0]).toMatchObject({
      reason: "not-enough-valid-points",
      requested: 2,
      available: 1,
    });
    expect(result.events.at(-1)?.type).toBe("spawn-rejected");
  });

  it("autorise une apparition partielle et explique le reliquat", () => {
    const result = spawnCreatures(
      room(),
      [creature],
      request({
        quantity: 2,
        candidateSpawnPointIds: ["est-haut", "desactive"],
        failureMode: "partial",
      }),
    );
    expect(result.created).toHaveLength(1);
    expect(result.rejected[0]?.reason).toBe("not-enough-valid-points");
    expect(result.events.map((event) => event.type)).toContain(
      "spawn-rejected",
    );
  });

  it("refuse une requête déjà traitée sans créer un doublon", () => {
    const first = spawnCreatures(room(), [creature], request());
    const second = spawnCreatures(first.state, [creature], request());
    expect(second.state).toBe(first.state);
    expect(second.rejected[0]?.reason).toBe("duplicate-request");
  });

  it("refuse quantité invalide, définition absente et salle terminale", () => {
    expect(
      spawnCreatures(room(), [creature], request({ quantity: 0 })).rejected[0]
        ?.reason,
    ).toBe("invalid-quantity");
    expect(
      spawnCreatures(room(), [], request({ creatureId: "fantome" })).rejected[0]
        ?.reason,
    ).toBe("creature-not-found");
    expect(
      spawnCreatures({ ...room(), phase: "victory" }, [creature], request())
        .rejected[0]?.reason,
    ).toBe("terminal-room");
  });

  it("poursuit la séquence persistée et évite les identifiants occupés", () => {
    const current = {
      ...room(),
      nextEnemyInstanceSequence: 2,
      enemies: [
        ...room().enemies,
        {
          ...room().enemies[0]!,
          id: "gobelin-bricoleur-spawn-2",
          position: { column: 1, row: 0 },
        },
      ],
    };
    const result = spawnCreatures(current, [creature], request());
    expect(result.created[0]?.id).toBe("gobelin-bricoleur-spawn-3");
    expect(result.state.nextEnemyInstanceSequence).toBe(4);
  });
});
