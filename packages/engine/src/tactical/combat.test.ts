import { describe, expect, it } from "vitest";
import { attackTarget, calculateDamage, getAttackableTargets } from "./combat";
import { hasLineOfSight, supercoverLine } from "./line-of-sight";
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
  it("couvre horizontale, verticale, diagonale, pente faible et pente forte", () => {
    const empty = state({ enemies: [] });
    expect(
      hasLineOfSight(empty, { column: 0, row: 0 }, { column: 3, row: 0 }),
    ).toBe(true);
    expect(
      hasLineOfSight(empty, { column: 0, row: 0 }, { column: 0, row: 3 }),
    ).toBe(true);
    expect(
      hasLineOfSight(empty, { column: 0, row: 0 }, { column: 3, row: 3 }),
    ).toBe(true);
    expect(
      hasLineOfSight(empty, { column: 0, row: 0 }, { column: 5, row: 2 }),
    ).toBe(true);
    expect(
      hasLineOfSight(empty, { column: 0, row: 0 }, { column: 2, row: 3 }),
    ).toBe(true);
  });

  it("inclut les deux cases touchées lors du passage exact par un coin", () => {
    const line = supercoverLine({ column: 0, row: 0 }, { column: 2, row: 2 });
    expect(line).toContainEqual({ column: 1, row: 0 });
    expect(line).toContainEqual({ column: 0, row: 1 });
    expect(line).toContainEqual({ column: 1, row: 1 });
    expect(
      hasLineOfSight(
        state({ enemies: [], obstacles: [{ column: 1, row: 0 }] }),
        { column: 0, row: 0 },
        { column: 2, row: 2 },
      ),
    ).toBe(false);
    expect(
      hasLineOfSight(
        state({ enemies: [], obstacles: [{ column: 0, row: 1 }] }),
        { column: 0, row: 0 },
        { column: 2, row: 2 },
      ),
    ).toBe(false);
  });

  it("bloque un obstacle central et une entité", () => {
    expect(
      hasLineOfSight(
        state({ obstacles: [{ column: 1, row: 0 }] }),
        { column: 0, row: 0 },
        { column: 2, row: 0 },
      ),
    ).toBe(false);
    expect(
      hasLineOfSight(state(), { column: 0, row: 0 }, { column: 2, row: 0 }, [
        "h",
      ]),
    ).toBe(false);
  });

  it("applique les dégâts et le minimum de 1", () => {
    const current = state();
    expect(calculateDamage(current.heroes[0]!, current.enemies[0]!)).toBe(3);
    expect(
      calculateDamage({ ...current.heroes[0]!, atk: 1 }, current.enemies[0]!),
    ).toBe(1);
  });

  it("retourne uniquement les vraies cibles attaquables", () => {
    expect(getAttackableTargets(state(), "h")).toEqual(["e"]);
    expect(
      getAttackableTargets(state({ obstacles: [{ column: 0, row: 0 }] }), "h"),
    ).toEqual(["e"]);
    expect(
      getAttackableTargets(
        state({
          enemies: [
            {
              ...state().enemies[0]!,
              position: { column: 3, row: 0 },
            },
          ],
          obstacles: [{ column: 1, row: 0 }],
        }),
        "h",
      ),
    ).toEqual([]);
    expect(getAttackableTargets(state({ activeHeroId: null }), "h")).toEqual(
      [],
    );
  });

  it("déclenche immédiatement la victoire après le dernier coup", () => {
    const current = state({
      enemies: [{ ...state().enemies[0]!, hp: 2, maxHp: 5 }],
    });
    const result = attackTarget(current, "h", "e");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("attaque attendue");
    expect(result.value.state.enemies[0]!.alive).toBe(false);
    expect(result.value.state.phase).toBe("victory");
    expect(result.value.state.activeHeroId).toBeNull();
  });

  it("ne consomme aucune action lors d'une attaque invalide", () => {
    const current = state({
      enemies: [{ ...state().enemies[0]!, position: { column: 7, row: 0 } }],
    });
    const result = attackTarget(current, "h", "e");
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe("out-of-range");
    expect(current.heroes[0]!.actionsRemaining).toBe(3);
  });
});
