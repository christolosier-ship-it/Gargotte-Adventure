import { describe, expect, it } from "vitest";
import { attackTarget, calculateDamage } from "./combat";
import { hasLineOfSight } from "./line-of-sight";
import type { RoomState } from "./types";
const state = (patch: Partial<RoomState> = {}): RoomState => ({
  version: 1,
  scenarioId: "t",
  width: 8,
  height: 4,
  obstacles: [],
  heroes: [
    {
      id: "h",
      name: "H",
      kind: "hero",
      position: { column: 0, row: 0 },
      hp: 10,
      maxHp: 10,
      atk: 4,
      def: 1,
      range: 3,
      alive: true,
      blocksMovement: true,
      actionsRemaining: 3,
      activationCompleted: false,
    },
  ],
  enemies: [
    {
      id: "e",
      name: "E",
      kind: "enemy",
      position: { column: 1, row: 0 },
      hp: 5,
      maxHp: 5,
      atk: 2,
      def: 1,
      range: 1,
      alive: true,
      blocksMovement: true,
    },
  ],
  activeHeroId: "h",
  phase: "heroes-turn",
  turn: 1,
  ...patch,
});
describe("portée ligne de vue combat", () => {
  it("voit mêlée, horizontale, verticale et diagonale", () => {
    let s = state({ enemies: [] });
    expect(
      hasLineOfSight(s, { column: 0, row: 0 }, { column: 1, row: 0 }),
    ).toBe(true);
    expect(
      hasLineOfSight(s, { column: 0, row: 0 }, { column: 3, row: 0 }),
    ).toBe(true);
    expect(
      hasLineOfSight(s, { column: 0, row: 0 }, { column: 0, row: 3 }),
    ).toBe(true);
    expect(
      hasLineOfSight(s, { column: 0, row: 0 }, { column: 3, row: 3 }),
    ).toBe(true);
  });
  it("bloque obstacle central, coin et entité", () => {
    expect(
      hasLineOfSight(
        state({ obstacles: [{ column: 1, row: 0 }] }),
        { column: 0, row: 0 },
        { column: 2, row: 0 },
      ),
    ).toBe(false);
    expect(
      hasLineOfSight(
        state({ obstacles: [{ column: 1, row: 1 }] }),
        { column: 0, row: 0 },
        { column: 2, row: 2 },
      ),
    ).toBe(false);
    expect(
      hasLineOfSight(state(), { column: 0, row: 0 }, { column: 2, row: 0 }, [
        "h",
      ]),
    ).toBe(false);
  });
  it("applique dégâts et minimum 1", () => {
    const s = state();
    expect(calculateDamage(s.heroes[0]!, s.enemies[0]!)).toBe(3);
    expect(calculateDamage({ ...s.heroes[0]!, atk: 1 }, s.enemies[0]!)).toBe(1);
  });
  it("attaque, met ko et ne consomme pas sur invalide", () => {
    const s = state({
      enemies: [
        {
          id: "e",
          name: "E",
          kind: "enemy",
          position: { column: 1, row: 0 },
          hp: 2,
          maxHp: 5,
          atk: 2,
          def: 1,
          range: 1,
          alive: true,
          blocksMovement: true,
        },
      ],
    });
    const r = attackTarget(s, "h", "e");
    expect(r.ok && r.value.state.enemies[0]!.alive).toBe(false);
    const far = attackTarget(
      state({
        enemies: [{ ...s.enemies[0]!, position: { column: 7, row: 0 } }],
      }),
      "h",
      "e",
    );
    expect(far.ok).toBe(false);
    expect(!far.ok && far.error.code).toBe("out-of-range");
  });
});
