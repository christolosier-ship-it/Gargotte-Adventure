import type { GridPosition } from "@gargotte/engine";
import type { AssetOrientation } from "./assets";

export interface AssetPreloadRequest {
  id: string;
  orientation?: AssetOrientation;
}

export interface TabletopAssetCatalog {
  canvasLabel: string;
  roomTitle: string;
  floorAssetIds: readonly [string, string];
  wallAssetId: string;
  obstacleAssetId: string;
  groundShadowAssetId?: string;
  combatantAssetIds: Readonly<Record<string, string>>;
  preload?: readonly AssetPreloadRequest[];
  characterTargetHeight?: number;
  obstacleTargetHeight?: number;
  wallScale?: number;
}

export function alternatingAssetId(
  position: GridPosition,
  assetIds: readonly [string, string],
): string {
  return (position.column + position.row) % 2 === 0
    ? assetIds[0]
    : assetIds[1];
}

export function assetStatusKey(
  assetId: string,
  orientation?: AssetOrientation,
): string {
  const base = assetId.replaceAll(".", "-");
  return orientation && orientation !== "omni"
    ? `${base}-${orientation}`
    : base;
}
