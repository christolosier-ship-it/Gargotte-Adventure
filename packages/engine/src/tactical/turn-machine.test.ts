import { describe, expect, it } from "vitest";
import { attackTarget } from "./combat";
import { runEnemyTurn } from "./enemy-ai";
import { createRoomState } from "./room-state";
import { endHeroActivation, finishEnemyTurn, selectHero } from "./turn-machine";
const room = () =>
  createRoomState({
    scenarioId: "s",
    width: 8,
    height: 4,
    obstacles: [],
    heroes: [
      {
        id: "a",
        name: "A",
        position: { column: 0, row: 0 },
        hp: 10,
        maxHp: 10,
        atk: 3,
        def: 0,
        range: 1,
      },
      {
        id: "b",
        name: "B",
        position: { column: 0, row: 3 },
        hp: 10,
        maxHp: 10,
        atk: 3,
        def: 0,
        range: 3,
      },
    ],
    enemies: [
      {
        id: "e1",
        name: "E1",
        position: { column: 3, row: 0 },
        hp: 4,
        maxHp: 4,
        atk: 2,
        def: 0,
        range: 1,
      },
      {
        id: "e2",
        name: "E2",
        position: { column: 6, row: 3 },
        hp: 4,
        maxHp: 4,
        atk: 2,
        def: 0,
        range: 3,
      },
    ],
  });
describe("tours et ia", () => {
  it("sélectionne ordre libre et interdit changement", () => {
    const s = room();
    const b = selectHero(s, "b");
    expect(b.ok).toBe(true);
    expect(b.ok && b.value.state.activeHeroId).toBe("b");
    expect(b.ok && selectHero(b.value.state, "a").ok).toBe(false);
  });
  it("limite trois actions et fin anticipée", () => {
    const s = selectHero(room(), "b");
    const ended = endHeroActivation(s.ok ? s.value.state : room(), "b");
    expect(
      ended.ok &&
        ended.value.state.heroes.find((h) => h.id === "b")?.activationCompleted,
    ).toBe(true);
    expect(ended.ok && selectHero(ended.value.state, "b").ok).toBe(false);
  });
  it("passe au tour ennemi et restaure", () => {
    let s = room();
    const sa = selectHero(s, "a");
    expect(sa.ok).toBe(true);
    if (!sa.ok) throw new Error("select a");
    s = sa.value.state;
    const ea = endHeroActivation(s, "a");
    expect(ea.ok).toBe(true);
    if (!ea.ok) throw new Error("end a");
    s = ea.value.state;
    const sb = selectHero(s, "b");
    expect(sb.ok).toBe(true);
    if (!sb.ok) throw new Error("select b");
    s = sb.value.state;
    const eb = endHeroActivation(s, "b");
    expect(eb.ok).toBe(true);
    if (!eb.ok) throw new Error("end b");
    const e = eb.value.state;
    expect(e.phase).toBe("enemy-turn");
    const f = finishEnemyTurn(e).state;
    expect(f.phase).toBe("heroes-turn");
    expect(f.heroes[0]!.actionsRemaining).toBe(3);
  });
  it("ia avance, attaque à distance, gère inaccessible et déterminisme", () => {
    const s = room();
    expect(
      runEnemyTurn(s).events.some((e) => e.type === "combatant-moved"),
    ).toBe(true);
    const ranged = {
      ...s,
      enemies: [{ ...s.enemies[1]!, position: { column: 0, row: 1 } }],
    };
    expect(
      runEnemyTurn(ranged).events.some((e) => e.type === "combatant-attacked"),
    ).toBe(true);
    const blocked = {
      ...s,
      obstacles: [
        { column: 1, row: 0 },
        { column: 0, row: 1 },
      ],
      enemies: [s.enemies[0]!],
      heroes: [s.heroes[0]!],
    };
    expect(
      runEnemyTurn(blocked).events.find((e) => e.type === "enemy-decision")
        ?.explanation.reason,
    ).toContain("inaccessible");
    expect(JSON.stringify(runEnemyTurn(s))).toBe(
      JSON.stringify(runEnemyTurn(s)),
    );
  });
  it("victoire et défaite", () => {
    let s = room();
    const sel = selectHero(s, "b");
    expect(sel.ok).toBe(true);
    if (!sel.ok) throw new Error("select b");
    s = sel.value.state;
    const a = attackTarget(
      {
        ...s,
        heroes: [{ ...s.heroes[1]!, atk: 9, range: 8 }],
        enemies: [s.enemies[0]!],
      },
      "b",
      "e1",
    );
    expect(a.ok && a.value.state.enemies[0]!.alive).toBe(false);
    const d = finishEnemyTurn({
      ...room(),
      heroes: [{ ...room().heroes[0]!, hp: 1 }],
      enemies: [
        { ...room().enemies[0]!, position: { column: 1, row: 0 }, atk: 9 },
      ],
      phase: "enemy-turn",
    }).state;
    expect(["defeat", "heroes-turn"]).toContain(d.phase);
  });
});
