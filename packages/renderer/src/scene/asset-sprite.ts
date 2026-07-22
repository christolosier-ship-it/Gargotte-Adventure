import { Container, Sprite } from "pixi.js";
import type { AssetOrientation, RuntimeAsset } from "../assets";
import type { SceneRenderContext } from "./context";
import {
  setCombatantAssetStatus,
  setEnvironmentAssetStatus,
} from "./diagnostics";

interface AssetSpriteOptions {
  assetId: string;
  orientation?: AssetOrientation;
  container: Container;
  insertAt: number;
  configure: (sprite: Sprite, asset: RuntimeAsset, mirrored: boolean) => void;
  onLoaded?: () => void;
  environmentStatusKey?: string;
  combatantId?: string;
}

function setStatus(
  context: SceneRenderContext,
  options: AssetSpriteOptions,
  status: string,
): void {
  if (options.environmentStatusKey)
    setEnvironmentAssetStatus(context, options.environmentStatusKey, status);
  if (options.combatantId)
    setCombatantAssetStatus(context, options.combatantId, status);
}

export async function addAssetSprite(
  context: SceneRenderContext,
  options: AssetSpriteOptions,
): Promise<void> {
  setStatus(context, options, "loading");
  const manifestLoaded = await context.manifestReady;
  if (!context.isCurrent(options.container)) return;
  if (!manifestLoaded) {
    setStatus(context, options, "manifest-missing");
    return;
  }

  const result = await context.assets.textureFor(
    options.assetId,
    options.orientation ?? "omni",
  );
  if (!context.isCurrent(options.container)) return;
  if (!result.ok) {
    setStatus(context, options, result.reason);
    return;
  }
  if (!result.texture) {
    setStatus(context, options, "placeholder");
    return;
  }

  const sprite = new Sprite(result.texture);
  sprite.label = `asset:${options.assetId}:${options.orientation ?? "omni"}`;
  sprite.eventMode = "none";
  sprite.anchor.set(result.asset.anchor.x, result.asset.anchor.y);
  options.configure(sprite, result.asset, result.mirrored);
  options.container.addChildAt(
    sprite,
    Math.min(options.insertAt, options.container.children.length),
  );
  options.onLoaded?.();
  setStatus(context, options, result.asset.format);
  context.canvas.dataset.assetCacheSize = String(context.assets.cacheSize);
}
