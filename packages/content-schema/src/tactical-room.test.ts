import { describe, expect, it } from "vitest";
import room from "../../../content/bastognac/sprint-1-room.json";
import { parseTacticalRoom } from "./index";
describe("contenu tactique", () => {
  it("valide le scénario sprint 1", () => {
    expect(parseTacticalRoom(room).heroes).toHaveLength(4);
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
        heroes: room.heroes.map((h, i) =>
          i === 0 ? { ...h, position: { column: 99, row: 0 } } : h,
        ),
      }),
    ).toThrow();
    expect(() =>
      parseTacticalRoom({
        ...room,
        heroes: room.heroes.map((h, i) =>
          i === 0 ? { ...h, position: room.obstacles[0] } : h,
        ),
      }),
    ).toThrow();
  });
});
