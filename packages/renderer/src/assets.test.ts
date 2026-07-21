import { describe, expect, it, vi } from "vitest";
import type { Texture } from "pixi.js";
import {
  IsometricAssetRegistry,
  validateRuntimeAssetManifest,
  type RuntimeAssetManifest,
} from "./assets";

const manifest: RuntimeAssetManifest = validateRuntimeAssetManifest({
  schemaVersion: 1,
  version: "test",
  basePath: "assets/isometric/",
  budgets: {
    pilotTotalBytes: 1048576,
    spritePilotBytes: 256000,
    technicalAssetBytes: 102400,
  },
  assets: [
    {
      id: "tile.fallback",
      category: "tile",
      path: "assets/isometric/tiles/fallback-tile.svg",
      format: "svg",
      dimensions: { width: 128, height: 64 },
      anchor: { x: 0.5, y: 0.5 },
      orientation: "omni",
      fallbackId: "tile.fallback",
      budgetBytes: 102400,
      required: true,
    },
    {
      id: "hero.test",
      category: "character",
      path: "assets/isometric/characters/test-se.webp",
      format: "webp",
      dimensions: { width: 128, height: 192 },
      anchor: { x: 0.5, y: 0.92 },
      orientation: "south-east",
      mirrorOf: { orientation: "south-west", axis: "horizontal" },
      fallbackId: "tile.fallback",
      budgetBytes: 256000,
      required: false,
    },
  ],
});

describe("runtime isometric asset manifest", () => {
  it("valide un manifeste correct", () =>
    expect(manifest.schemaVersion).toBe(1));
  it("rejette un manifeste invalide", () =>
    expect(() =>
      validateRuntimeAssetManifest({ schemaVersion: 2, assets: [] }),
    ).toThrow());
  it("détecte les identifiants dupliqués", () =>
    expect(() =>
      validateRuntimeAssetManifest({
        ...manifest,
        assets: [manifest.assets[0], manifest.assets[0]],
      }),
    ).toThrow(/dupliqué/));
  it("contrôle formats, budgets et chemins publics GitHub Pages", () => {
    expect(() =>
      validateRuntimeAssetManifest({
        ...manifest,
        assets: [
          {
            ...manifest.assets[0],
            path: "/assets/isometric/x.png",
            format: "png",
          },
        ],
      }),
    ).toThrow();
    expect(manifest.budgets.technicalAssetBytes).toBe(102400);
    expect(manifest.assets[0]?.path).toMatch(/^assets\/isometric\//);
  });
});

describe("IsometricAssetRegistry", () => {
  it("résout par identifiant et orientation", () => {
    const r = new IsometricAssetRegistry();
    r.setManifest(manifest);
    expect(r.resolve("hero.test", "south-east")).toMatchObject({
      ok: true,
      mirrored: false,
    });
  });
  it("applique le miroir horizontal", () => {
    const r = new IsometricAssetRegistry();
    r.setManifest(manifest);
    expect(r.resolve("hero.test", "south-west")).toMatchObject({
      ok: true,
      mirrored: true,
    });
  });
  it("fallback sur orientation manquante et asset absent", () => {
    const r = new IsometricAssetRegistry();
    r.setManifest(manifest);
    expect(r.resolve("hero.test", "north-east")).toMatchObject({
      ok: false,
      reason: "orientation-missing",
    });
    expect(r.resolve("missing")).toMatchObject({
      ok: false,
      reason: "asset-missing",
    });
  });
  it("rend l'erreur de texture non fatale", async () => {
    const r = new IsometricAssetRegistry(async () => {
      throw new Error("boom");
    });
    r.setManifest(manifest);
    await expect(r.textureFor("tile.fallback")).resolves.toMatchObject({
      ok: false,
      reason: "texture-error",
    });
  });
  it("évite les doubles chargements et libère le cache", async () => {
    const load = vi.fn(async () => ({}) as Texture);
    const r = new IsometricAssetRegistry(load);
    r.setManifest(manifest);
    await r.textureFor("tile.fallback");
    await r.textureFor("tile.fallback");
    expect(load).toHaveBeenCalledTimes(1);
    expect(r.cacheSize).toBe(1);
    r.destroy();
    expect(r.cacheSize).toBe(0);
  });
});
