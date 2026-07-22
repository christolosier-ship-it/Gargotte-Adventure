import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  IsometricAssetRegistry,
  environmentTileAssetId,
  validateRuntimeAssetManifest,
} from "./index";

const manifest = validateRuntimeAssetManifest(
  JSON.parse(
    readFileSync("apps/game/public/assets/isometric/manifest.json", "utf8"),
  ),
);

const environmentFiles = [
  [
    "tile.bastognac-floor-a",
    "apps/game/public/assets/isometric/tiles/bastognac-floor-a.svg",
    128,
    64,
  ],
  [
    "tile.bastognac-floor-b",
    "apps/game/public/assets/isometric/tiles/bastognac-floor-b.svg",
    128,
    64,
  ],
  [
    "wall.bastognac",
    "apps/game/public/assets/isometric/walls/bastognac-wall-se.svg",
    128,
    128,
  ],
  [
    "wall.bastognac",
    "apps/game/public/assets/isometric/walls/bastognac-wall-ne.svg",
    128,
    128,
  ],
  [
    "prop.bastognac-barrel",
    "apps/game/public/assets/isometric/props/bastognac-barrel.svg",
    96,
    96,
  ],
] as const;

describe("Bastognac environment runtime assets", () => {
  it("alterne les deux sols sans dépendre des états tactiques", () => {
    expect(environmentTileAssetId({ column: 0, row: 0 })).toBe(
      "tile.bastognac-floor-a",
    );
    expect(environmentTileAssetId({ column: 1, row: 0 })).toBe(
      "tile.bastognac-floor-b",
    );
    expect(environmentTileAssetId({ column: 3, row: 3 })).toBe(
      "tile.bastognac-floor-a",
    );
  });

  it("déclare les dimensions, formats, fallbacks et budgets attendus", () => {
    expect(manifest.version).toBe("2B.3.0");
    for (const [id, path, width, height] of environmentFiles) {
      const asset = manifest.assets.find(
        (candidate) =>
          candidate.id === id &&
          candidate.path.endsWith(path.split("/").at(-1) ?? ""),
      );
      expect(asset).toMatchObject({
        id,
        format: "svg",
        dimensions: { width, height },
        budgetBytes: 102400,
        required: false,
      });
      expect(statSync(path).size).toBeLessThanOrEqual(102400);
      expect(readFileSync(path, "utf8")).toContain("data:image/webp;base64,");
    }
  });

  it("résout les deux murs sans miroir et le tonneau avec son ancrage au sol", () => {
    const registry = new IsometricAssetRegistry();
    registry.setManifest(manifest);
    expect(registry.resolve("wall.bastognac", "south-east")).toMatchObject({
      ok: true,
      mirrored: false,
      asset: { anchor: { x: 0.5, y: 0.82 } },
    });
    expect(registry.resolve("wall.bastognac", "north-east")).toMatchObject({
      ok: true,
      mirrored: false,
      asset: { anchor: { x: 0.5, y: 0.82 } },
    });
    expect(registry.resolve("prop.bastognac-barrel")).toMatchObject({
      ok: true,
      mirrored: false,
      asset: {
        anchor: { x: 0.5, y: 0.96 },
        fallbackId: "prop.fallback-obstacle",
      },
    });
    registry.destroy();
  });
});
