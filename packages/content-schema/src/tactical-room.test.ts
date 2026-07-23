import { describe, expect, it } from "vitest";
import creatures from "../../../content/bastognac/creatures.json";
import room from "../../../content/bastognac/sprint-1-room.json";
import { parseCreatureCatalog, parseTacticalRoom } from "./index";

const officialHeroes = [
  ["brunhilda", "Brünhilda la Torgnole"],
  ["aelion", "Aelion Trois-Gorgées"],
  ["magdalena", "Magdalena Coquinelle"],
  ["grompif", "Grompif Arcabidon"],
] as const;

describe("contenu tactique", () => {
  it("valide le catalogue pilote et les quatre héros officiels", () => {
    const catalog = parseCreatureCatalog(creatures);
    const parsed = parseTacticalRoom(room);
    expect(catalog.creatures.map((creature) => creature.id)).toEqual([
      "gobelin-bricoleur",
      "gobelin-lance-tout",
    ]);
    expect(parsed.heroes.map(({ id, name }) => [id, name])).toEqual(
      officialHeroes,
    );
    expect(parsed.enemies.every((enemy) => "creatureId" in enemy)).toBe(true);
  });

  it("référence uniquement des créatures et points de spawn connus", () => {
    const catalog = parseCreatureCatalog(creatures);
    const parsed = parseTacticalRoom(room);
    const creatureIds = new Set(
      catalog.creatures.map((creature) => creature.id),
    );
    const pointIds = new Set(parsed.spawnPoints.map((point) => point.id));

    expect(
      parsed.enemies.every((enemy) => creatureIds.has(enemy.creatureId)),
    ).toBe(true);
    expect(
      parsed.scriptedSpawns.every(
        (spawn) =>
          creatureIds.has(spawn.creatureId) &&
          spawn.candidateSpawnPointIds.every((id) => pointIds.has(id)),
      ),
    ).toBe(true);
  });

  it("rejette doublons, hors plateau et obstacle", () => {
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
        heroes: room.heroes.map((hero, index) =>
          index === 0 ? { ...hero, position: room.obstacles[0] } : hero,
        ),
      }),
    ).toThrow();
  });

  it("rejette un spawn scripté pointant vers un point absent", () => {
    expect(() =>
      parseTacticalRoom({
        ...room,
        scriptedSpawns: [
          {
            ...room.scriptedSpawns[0],
            candidateSpawnPointIds: ["porte-fantome"],
          },
        ],
      }),
    ).toThrow();
  });

  it("rejette les définitions de créatures dupliquées", () => {
    expect(() =>
      parseCreatureCatalog({
        ...creatures,
        creatures: [creatures.creatures[0], creatures.creatures[0]],
      }),
    ).toThrow();
  });
});
