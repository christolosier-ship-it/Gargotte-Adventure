import { describe, expect, it } from "vitest";
import creatures from "../../../content/bastognac/creatures.json";
import interactables from "../../../content/bastognac/interactables.json";
import room from "../../../content/bastognac/room-1.json";
import legacyRoom from "../../../content/bastognac/sprint-1-room.json";
import {
  parseCreatureCatalog,
  parseInteractableCatalog,
  parseTacticalRoom,
} from "./index";

const officialHeroes = [
  ["brunhilda", "Brünhilda la Torgnole"],
  ["aelion", "Aelion Trois-Gorgées"],
  ["magdalena", "Magdalena Coquinelle"],
  ["grompif", "Grompif Arcabidon"],
] as const;

describe("contenu tactique", () => {
  it("valide les catalogues, objets, héros et populations initiales", () => {
    const creatureCatalog = parseCreatureCatalog(creatures);
    const interactableCatalog = parseInteractableCatalog(interactables);
    const parsed = parseTacticalRoom(room);
    expect(creatureCatalog.creatures.map((creature) => creature.id)).toEqual([
      "gobelin-bricoleur",
      "gobelin-lance-tout",
    ]);
    expect(
      interactableCatalog.interactables.map((object) => object.kind),
    ).toEqual(["table", "barrel", "gate", "torch", "pillar"]);
    expect(parsed.heroes.map(({ id, name }) => [id, name])).toEqual(
      officialHeroes,
    );
    expect(parsed.initialSpawns).toHaveLength(1);
    expect(parsed.interactables).toHaveLength(2);
  });

  it("référence uniquement des créatures, objets, états et points connus", () => {
    const creatureCatalog = parseCreatureCatalog(creatures);
    const interactableCatalog = parseInteractableCatalog(interactables);
    const parsed = parseTacticalRoom(room);
    const creatureIds = new Set(
      creatureCatalog.creatures.map((creature) => creature.id),
    );
    const definitions = new Map(
      interactableCatalog.interactables.map((definition) => [
        definition.id,
        definition,
      ]),
    );
    const pointIds = new Set(parsed.spawnPoints.map((point) => point.id));

    expect(
      [...parsed.initialSpawns, ...parsed.scriptedSpawns].every(
        (spawn) =>
          creatureIds.has(spawn.creatureId) &&
          spawn.candidateSpawnPointIds.every((id) => pointIds.has(id)),
      ),
    ).toBe(true);
    expect(
      parsed.interactables.every((placement) => {
        const definition = definitions.get(placement.interactableId);
        return definition?.states.some(
          (state) => state.id === placement.stateId,
        );
      }),
    ).toBe(true);
  });

  it("migre le schéma v5 vers des demandes de spawn initiales", () => {
    const parsed = parseTacticalRoom(legacyRoom);
    expect(parsed.schemaVersion).toBe(6);
    expect(parsed.initialSpawns).toHaveLength(2);
    expect(parsed.spawnPoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "initial-gobelin-bricoleur-initial-1" }),
        expect.objectContaining({ id: "initial-gobelin-lance-tout-initial-1" }),
      ]),
    );
  });

  it("rejette doublons, hors plateau et collision avec un obstacle", () => {
    expect(() =>
      parseTacticalRoom({
        ...room,
        heroes: [
          room.heroes[0],
          room.heroes[0],
          room.heroes[2],
          room.heroes[3],
        ],
      }),
    ).toThrow();
    expect(() =>
      parseTacticalRoom({
        ...room,
        heroes: room.heroes.map((hero, index) =>
          index === 0 ? { ...hero, position: { column: 99, row: 0 } } : hero,
        ),
      }),
    ).toThrow();
    expect(() =>
      parseTacticalRoom({
        ...room,
        interactables: room.interactables.map((object, index) =>
          index === 0 ? { ...object, position: room.obstacles[0] } : object,
        ),
      }),
    ).toThrow();
  });

  it("rejette un identifiant partagé entre héros et objet", () => {
    expect(() =>
      parseTacticalRoom({
        ...room,
        interactables: room.interactables.map((object, index) =>
          index === 0 ? { ...object, id: room.heroes[0]!.id } : object,
        ),
      }),
    ).toThrow(/identifiant d’instance dupliqué brunhilda/);
  });

  it("rejette une population initiale pointant vers un point absent", () => {
    expect(() =>
      parseTacticalRoom({
        ...room,
        initialSpawns: [
          {
            ...room.initialSpawns[0],
            candidateSpawnPointIds: ["porte-fantome"],
          },
        ],
      }),
    ).toThrow(/point absent/);
  });

  it("rejette des points partageant une position", () => {
    expect(() =>
      parseTacticalRoom({
        ...room,
        spawnPoints: [
          room.spawnPoints[0]!,
          {
            ...room.spawnPoints[1]!,
            position: room.spawnPoints[0]!.position,
          },
        ],
      }),
    ).toThrow();
  });

  it("rejette les définitions de créatures et d’objets dupliquées", () => {
    expect(() =>
      parseCreatureCatalog({
        ...creatures,
        creatures: [creatures.creatures[0], creatures.creatures[0]],
      }),
    ).toThrow();
    expect(() =>
      parseInteractableCatalog({
        ...interactables,
        interactables: [
          interactables.interactables[0],
          interactables.interactables[0],
        ],
      }),
    ).toThrow();
  });
});
