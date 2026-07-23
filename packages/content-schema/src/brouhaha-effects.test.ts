import { describe, expect, it } from "vitest";
import effects from "../../../content/bastognac/brouhaha-effects.json";
import { parseBrouhahaEffectCatalog } from "./index";

describe("catalogue de Brouhaha", () => {
  it("valide les effets universels et propres à Bastognac", () => {
    const catalog = parseBrouhahaEffectCatalog(effects);
    expect(catalog.effects).toHaveLength(6);
    expect(
      catalog.effects.some((effect) => effect.scope.type === "universal"),
    ).toBe(true);
    expect(
      catalog.effects.some(
        (effect) =>
          effect.scope.type === "dungeon" &&
          effect.scope.dungeonId === "chateau-de-bastognac",
      ),
    ).toBe(true);
  });

  it("exige un effet universel aux niveaux 0 à 9 et deux aux niveaux 10 à 12", () => {
    expect(() =>
      parseBrouhahaEffectCatalog({
        schemaVersion: 1,
        effects: [
          {
            id: "seul-effet",
            name: "Seul",
            description: "Catalogue incomplet",
            scope: { type: "universal" },
            minLevel: 0,
            maxLevel: 12,
          },
          {
            id: "effet-donjon",
            name: "Local",
            description: "Ne remplace pas le filet universel",
            scope: { type: "dungeon", dungeonId: "test" },
            minLevel: 10,
            maxLevel: 12,
          },
        ],
      }),
    ).toThrow();
  });

  it("rejette les identifiants dupliqués et les plages inversées", () => {
    expect(() =>
      parseBrouhahaEffectCatalog({
        ...effects,
        effects: [effects.effects[0], effects.effects[0]],
      }),
    ).toThrow();
    expect(() =>
      parseBrouhahaEffectCatalog({
        ...effects,
        effects: effects.effects.map((effect, index) =>
          index === 0 ? { ...effect, minLevel: 8, maxLevel: 2 } : effect,
        ),
      }),
    ).toThrow();
  });
});
