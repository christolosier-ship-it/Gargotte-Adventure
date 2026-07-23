import type { Container } from "pixi.js";
import type { GridPosition } from "@gargotte/engine";
import type { IsometricAssetRegistry } from "../assets";
import type { TabletopAssetCatalog } from "../catalog";
import type { IsometricProjection, ScreenPosition } from "../projection";
import type { CameraRotation, GridDimensions } from "../view";

export type SceneLayerName =
  | "backdrop"
  | "floor"
  | "backWall"
  | "object"
  | "interface";

export type SceneLayers = Record<SceneLayerName, Container>;

export interface SceneListeners {
  cell: ((position: GridPosition) => void)[];
  hero: ((id: string) => void)[];
  enemy: ((id: string) => void)[];
  interactable: ((id: string) => void)[];
}

export interface SceneRenderContext {
  canvas: HTMLCanvasElement;
  assets: IsometricAssetRegistry;
  catalog: TabletopAssetCatalog;
  layers: SceneLayers;
  projection: IsometricProjection;
  roomDimensions: GridDimensions;
  rotation: CameraRotation;
  generation: number;
  manifestReady: Promise<boolean>;
  listeners: SceneListeners;
  isCurrent(container?: Container): boolean;
  viewPosition(position: GridPosition): GridPosition;
  projectedPosition(position: GridPosition): ScreenPosition;
}
