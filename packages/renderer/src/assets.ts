import type { Texture } from "pixi.js";
import { z } from "zod";

export const assetBudgets = {
  allowedFormats: ["svg", "webp"],
  spritePilotBytes: 250 * 1024,
  technicalAssetBytes: 100 * 1024,
  pilotTotalBytes: 1024 * 1024,
} as const;
export const assetOrientations = [
  "omni",
  "south-east",
  "south-west",
  "north-east",
  "north-west",
] as const;
const orientationSchema = z.enum(assetOrientations);
export const runtimeAssetSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/),
  category: z.enum(["tile", "wall", "prop", "character", "common", "fx"]),
  path: z.string().min(1),
  format: z.enum(assetBudgets.allowedFormats),
  dimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  anchor: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
  orientation: orientationSchema,
  mirrorOf: z
    .object({
      orientation: orientationSchema.exclude(["omni"]),
      axis: z.literal("horizontal"),
    })
    .optional(),
  fallbackId: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/),
  budgetBytes: z.number().int().positive(),
  required: z.boolean(),
});
export const runtimeAssetManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    version: z.string().min(1),
    basePath: z.literal("assets/isometric/"),
    budgets: z.object({
      pilotTotalBytes: z.number().int().positive(),
      spritePilotBytes: z.number().int().positive(),
      technicalAssetBytes: z.number().int().positive(),
    }),
    assets: z.array(runtimeAssetSchema).min(1),
  })
  .superRefine((manifest, ctx) => {
    const ids = new Set<string>();
    for (const asset of manifest.assets) {
      if (ids.has(asset.id))
        ctx.addIssue({
          code: "custom",
          path: ["assets", asset.id],
          message: `Identifiant dupliqué: ${asset.id}`,
        });
      ids.add(asset.id);
      if (
        !asset.path.startsWith(manifest.basePath) ||
        asset.path.includes("..") ||
        asset.path.startsWith("/")
      )
        ctx.addIssue({
          code: "custom",
          path: ["assets", asset.id, "path"],
          message: `Chemin public invalide pour ${asset.id}: ${asset.path}`,
        });
      if (!asset.path.endsWith(`.${asset.format}`))
        ctx.addIssue({
          code: "custom",
          path: ["assets", asset.id, "format"],
          message: `Extension incohérente pour ${asset.id}`,
        });
    }
    for (const asset of manifest.assets)
      if (!ids.has(asset.fallbackId))
        ctx.addIssue({
          code: "custom",
          path: ["assets", asset.id, "fallbackId"],
          message: `Fallback absent pour ${asset.id}: ${asset.fallbackId}`,
        });
  });
export type RuntimeAsset = z.infer<typeof runtimeAssetSchema>;
export type RuntimeAssetManifest = z.infer<typeof runtimeAssetManifestSchema>;
export type AssetOrientation = (typeof assetOrientations)[number];
export type AssetResolveResult =
  | { ok: true; asset: RuntimeAsset; texture?: Texture; mirrored: boolean }
  | {
      ok: false;
      reason:
        | "manifest-missing"
        | "asset-missing"
        | "orientation-missing"
        | "texture-error";
      fallback?: RuntimeAsset;
      error?: unknown;
    };
export function validateRuntimeAssetManifest(
  input: unknown,
): RuntimeAssetManifest {
  return runtimeAssetManifestSchema.parse(input);
}
export const defaultAssetManifestUrl = "assets/isometric/manifest.json";
const makePublicUrl = (path: string, base = import.meta.env.BASE_URL) =>
  `${base}${path}`.replace(/([^:]\/)\/+/g, "$1");
export class IsometricAssetRegistry {
  private manifest: RuntimeAssetManifest | null = null;
  private cache = new Map<string, Promise<Texture>>();
  constructor(
    private readonly loadTexture: (url: string) => Promise<Texture> = async (
      url,
    ) => {
      const { Assets } = await import("pixi.js");
      return Assets.load<Texture>(url);
    },
  ) {}
  async loadManifest(
    url = makePublicUrl(defaultAssetManifestUrl),
  ): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.manifest = validateRuntimeAssetManifest(await response.json());
      return true;
    } catch (error) {
      console.error("[assets] manifeste isométrique indisponible", error);
      this.manifest = null;
      return false;
    }
  }
  setManifest(manifest: RuntimeAssetManifest): void {
    this.manifest = manifest;
  }
  resolve(
    id: string,
    orientation: AssetOrientation = "omni",
  ): AssetResolveResult {
    if (!this.manifest) return { ok: false, reason: "manifest-missing" };
    const candidates = this.manifest.assets.filter((asset) => asset.id === id);
    if (candidates.length === 0) return this.fallback(id, "asset-missing");
    const direct = candidates.find(
      (asset) =>
        asset.orientation === orientation || asset.orientation === "omni",
    );
    if (direct) return { ok: true, asset: direct, mirrored: false };
    const mirrored = candidates.find(
      (asset) => asset.mirrorOf?.orientation === orientation,
    );
    if (mirrored) return { ok: true, asset: mirrored, mirrored: true };
    return this.fallback(
      candidates[0]?.fallbackId ?? id,
      "orientation-missing",
    );
  }
  async textureFor(
    id: string,
    orientation: AssetOrientation = "omni",
  ): Promise<AssetResolveResult> {
    const resolved = this.resolve(id, orientation);
    if (!resolved.ok) return resolved;
    const url = makePublicUrl(resolved.asset.path);
    let promise = this.cache.get(url);
    if (!promise) {
      promise = this.loadTexture(url);
      this.cache.set(url, promise);
    }
    try {
      return { ...resolved, texture: await promise };
    } catch (error) {
      console.error(`[assets] texture échouée: ${resolved.asset.id}`, error);
      this.cache.delete(url);
      return {
        ok: false,
        reason: "texture-error",
        fallback: resolved.asset,
        error,
      };
    }
  }
  destroy(): void {
    this.cache.clear();
  }
  get cacheSize(): number {
    return this.cache.size;
  }
  private fallback(
    id: string,
    reason: "asset-missing" | "orientation-missing",
  ): AssetResolveResult {
    const asset = this.manifest?.assets.find(
      (candidate) => candidate.id === id,
    );
    return { ok: false, reason, fallback: asset };
  }
}
