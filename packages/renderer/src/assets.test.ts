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
    {
      id: "hero.test",
      category: "character",
      path: "assets/isometric/characters/test-ne.webp",
      format: "webp",
      dimensions: { width: 128, height: 192 },
      anchor: { x: 0.5, y: 0.92 },
      orientation: "north-east",
      mirrorOf: { orientation: "north-west", axis: "horizontal" },
      fallbackId: "tile.fallback",
      budgetBytes: 256000,
      required: false,
    },
  ],
});

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("runtime isometric asset manifest", () => {
  it("valide plusieurs orientations pour un même identifiant", () => {
    expect(manifest.schemaVersion).toBe(1);
    expect(
      manifest.assets.filter((asset) => asset.id === "hero.test"),
    ).toHaveLength(2);
  });
  it("rejette un manifeste invalide", () =>
    expect(() =>
      validateRuntimeAssetManifest({ schemaVersion: 2, assets: [] }),
    ).toThrow());
  it("détecte une variante id et orientation dupliquée", () =>
    expect(() =>
      validateRuntimeAssetManifest({
        ...manifest,
        assets: [manifest.assets[0], manifest.assets[0]],
      }),
    ).toThrow(/Variante dupliquée/));
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
    expect(() =>
      validateRuntimeAssetManifest({
        ...manifest,
        budgets: { ...manifest.budgets, pilotTotalBytes: 42 },
      }),
    ).toThrow(/budgets/);
    expect(manifest.budgets.technicalAssetBytes).toBe(102400);
    expect(manifest.assets[0]?.path).toMatch(/^assets\/isometric\//);
  });
});

describe("IsometricAssetRegistry", () => {
  it("résout les orientations directes d’un même identifiant", () => {
    const registry = new IsometricAssetRegistry();
    registry.setManifest(manifest);
    expect(registry.resolve("hero.test", "south-east")).toMatchObject({
      ok: true,
      mirrored: false,
      asset: { path: expect.stringContaining("test-se.webp") },
    });
    expect(registry.resolve("hero.test", "north-east")).toMatchObject({
      ok: true,
      mirrored: false,
      asset: { path: expect.stringContaining("test-ne.webp") },
    });
  });
  it("applique le miroir horizontal", () => {
    const registry = new IsometricAssetRegistry();
    registry.setManifest(manifest);
    expect(registry.resolve("hero.test", "south-west")).toMatchObject({
      ok: true,
      mirrored: true,
    });
  });
  it("retourne le fallback sur orientation manquante et signale un asset absent", () => {
    const registry = new IsometricAssetRegistry();
    registry.setManifest(manifest);
    expect(registry.resolve("hero.test", "omni")).toMatchObject({
      ok: false,
      reason: "orientation-missing",
      fallback: { id: "tile.fallback" },
    });
    expect(registry.resolve("missing")).toMatchObject({
      ok: false,
      reason: "asset-missing",
    });
  });
  it("rend l’erreur de texture non fatale avec le vrai fallback", async () => {
    const registry = new IsometricAssetRegistry(async () => {
      throw new Error("boom");
    });
    registry.setManifest(manifest);
    await expect(
      registry.textureFor("hero.test", "south-east"),
    ).resolves.toMatchObject({
      ok: false,
      reason: "texture-error",
      fallback: { id: "tile.fallback" },
    });
  });
  it("évite les doubles chargements et libère la texture chargée", async () => {
    const texture = {} as Texture;
    const load = vi.fn(async () => texture);
    const release = vi.fn(async () => undefined);
    const registry = new IsometricAssetRegistry(load, release);
    registry.setManifest(manifest);
    await registry.textureFor("tile.fallback");
    await registry.textureFor("tile.fallback");
    expect(load).toHaveBeenCalledTimes(1);
    expect(registry.cacheSize).toBe(1);
    registry.destroy();
    await nextTask();
    expect(registry.cacheSize).toBe(0);
    expect(release).toHaveBeenCalledTimes(1);
    expect(registry.resolve("tile.fallback")).toMatchObject({
      ok: false,
      reason: "registry-destroyed",
    });
  });
  it("libère aussi une texture dont le chargement finit après destroy", async () => {
    let completeLoad: ((texture: Texture) => void) | undefined;
    const texture = {} as Texture;
    const load = vi.fn(
      () =>
        new Promise<Texture>((resolve) => {
          completeLoad = resolve;
        }),
    );
    const release = vi.fn(async () => undefined);
    const registry = new IsometricAssetRegistry(load, release);
    registry.setManifest(manifest);
    const pending = registry.textureFor("tile.fallback");
    registry.destroy();
    completeLoad?.(texture);
    await expect(pending).resolves.toMatchObject({
      ok: false,
      reason: "registry-destroyed",
    });
    await nextTask();
    expect(release).toHaveBeenCalledTimes(1);
  });
});

describe("pilot character runtime assets", () => {
  it("déclare Brünhilda et le Gobelin en WebP omnidirectionnels ancrés au sol", async () => {
    const fs = await import("node:fs");
    const runtime = validateRuntimeAssetManifest(
      JSON.parse(
        fs.readFileSync(
          "apps/game/public/assets/isometric/manifest.json",
          "utf8",
        ),
      ),
    );
    for (const [id, size, path] of [
      [
        "character.brunhilda",
        11364,
        "apps/game/public/assets/isometric/characters/brunhilda.webp",
      ],
      [
        "character.gobelin-bricoleur",
        12064,
        "apps/game/public/assets/isometric/characters/gobelin-bricoleur.webp",
      ],
    ] as const) {
      const asset = runtime.assets.find((candidate) => candidate.id === id);
      expect(asset).toMatchObject({
        category: "character",
        format: "webp",
        dimensions: { width: 128, height: 192 },
        anchor: { x: 0.5, y: 0.92 },
        orientation: "omni",
        fallbackId: "tile.fallback",
        budgetBytes: 256000,
        required: false,
      });
      expect(asset?.path).toMatch(/^assets\/isometric\/characters\//);
      expect(asset?.mirrorOf).toBeUndefined();
      expect(fs.statSync(path).size).toBe(size);
    }
  });

  it("résout les sprites pilotes sans miroir et garde le placeholder si une orientation dessinée manque", () => {
    const registry = new IsometricAssetRegistry();
    const runtime = validateRuntimeAssetManifest({
      ...manifest,
      assets: [
        ...manifest.assets,
        {
          id: "character.brunhilda",
          category: "character",
          path: "assets/isometric/characters/brunhilda.webp",
          format: "webp",
          dimensions: { width: 128, height: 192 },
          anchor: { x: 0.5, y: 0.92 },
          orientation: "omni",
          fallbackId: "tile.fallback",
          budgetBytes: 256000,
          required: false,
        },
        {
          id: "character.gobelin-bricoleur",
          category: "character",
          path: "assets/isometric/characters/gobelin-bricoleur.webp",
          format: "webp",
          dimensions: { width: 128, height: 192 },
          anchor: { x: 0.5, y: 0.92 },
          orientation: "omni",
          fallbackId: "tile.fallback",
          budgetBytes: 256000,
          required: false,
        },
      ],
    });
    registry.setManifest(runtime);
    expect(registry.resolve("character.brunhilda", "south-east")).toMatchObject(
      { ok: true, mirrored: false },
    );
    expect(
      registry.resolve("character.gobelin-bricoleur", "north-west"),
    ).toMatchObject({ ok: true, mirrored: false });
    expect(registry.resolve("hero.test", "north-west")).toMatchObject({
      ok: true,
      mirrored: true,
    });
    registry.destroy();
  });
});
