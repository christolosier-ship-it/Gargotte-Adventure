import { describe, expect, it } from "vitest";
import room from "../../../content/bastognac/sprint-1-room.json";
import { parseTacticalRoom } from "./index";

const officialHeroes = [
  ["brunhilda", "Brünhilda la Torgnole"],
  ["aelion", "Aelion Trois-Gorgées"],
  ["magdalena", "Magdalena Coquinelle"],
  ["grompif", "Grompif Arcabidon"],
] as const;

describe("contenu tactique", () => {
  it("valide le scénario et les quatre héros officiels", () => {
    const parsed = parseTacticalRoom(room);
    expect(parsed.heroes).toHaveLength(4);
    expect(parsed.heroes.map(({ id, name }) => [id, name])).toEqual(
      officialHeroes,
    );
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
});
