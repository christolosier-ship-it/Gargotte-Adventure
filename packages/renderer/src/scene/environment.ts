import { Container, Graphics, type Sprite } from "pixi.js";
import type { GridPosition } from "@gargotte/engine";
import tokens from "../../../../design/isometric/tokens.json";
import { alternatingAssetId, assetStatusKey } from "../catalog";
import {
  gridToScreen,
  isometricTileGeometry,
  stableDepth,
} from "../projection";
import type { VisibleWallSegment } from "../view";
import { addAssetSprite } from "./asset-sprite";
import type { SceneRenderContext } from "./context";
import {
  diamond,
  tileHitArea,
  tileStyle,
  tokenNumber,
  type TileState,
} from "./primitives";

function configureTileSprite(
  context: SceneRenderContext,
  sprite: Sprite,
  width: number,
  height: number,
  mirrored: boolean,
): void {
  const scaleX = context.projection.tileWidth / width;
  const scaleY = context.projection.tileHeight / height;
  sprite.scale.set(mirrored ? -scaleX : scaleX, scaleY);
  sprite.position.set(0, 0);
}

export function drawTile(
  context: SceneRenderContext,
  position: GridPosition,
  tileKind: TileState,
): void {
  const screen = context.projectedPosition(position);
  const baseKind =
    (position.column + position.row) % 2 === 0 ? "base" : "alternate";
  const baseStyle = tileStyle[baseKind];
  const cell = new Container();
  cell.eventMode = "static";
  cell.cursor = "pointer";
  cell.hitArea = tileHitArea;
  cell.label = `cell:${position.column},${position.row}`;
  cell.position.set(screen.x, screen.y);
  cell.zIndex = stableDepth(screen.y, context.projection.tileHeight, 0);
  cell.on("pointertap", () =>
    context.listeners.cell.forEach((listener) => listener(position)),
  );

  const fallback = new Graphics()
    .poly(diamond())
    .fill({ color: baseStyle.color, alpha: baseStyle.alpha })
    .stroke({ color: tokenNumber(tokens.color.primitive.line), width: 2 });
  fallback.eventMode = "none";
  cell.addChild(fallback);

  if (tileKind !== "base" && tileKind !== "alternate") {
    const overlayStyle = tileStyle[tileKind];
    const overlay = new Graphics()
      .poly(diamond())
      .fill({ color: overlayStyle.color, alpha: overlayStyle.alpha })
      .stroke({
        color: overlayStyle.color,
        width: tileKind === "selected" || tileKind === "attackable" ? 4 : 2,
        alpha: Math.min(1, overlayStyle.alpha + 0.2),
      });
    overlay.eventMode = "none";
    overlay.label = `overlay:${tileKind}:${position.column},${position.row}`;
    cell.addChild(overlay);
  }

  context.layers.floor.addChild(cell);
  const assetId = alternatingAssetId(position, context.catalog.floorAssetIds);
  const statusKey = assetStatusKey(assetId);
  void addAssetSprite(context, {
    assetId,
    environmentStatusKey: statusKey,
    container: cell,
    insertAt: 1,
    configure(sprite, asset, mirrored) {
      configureTileSprite(
        context,
        sprite,
        asset.dimensions.width,
        asset.dimensions.height,
        mirrored,
      );
    },
  }).catch((error: unknown) => {
    if (!context.isCurrent(cell)) return;
    console.error(`[assets] sol échoué: ${assetId}`, error);
  });

  if (tileKind === "blocked") drawObstacle(context, position);
}

export function drawObstacle(
  context: SceneRenderContext,
  position: GridPosition,
): void {
  const screen = context.projectedPosition(position);
  const obstacle = new Container();
  obstacle.eventMode = "none";
  obstacle.label = `obstacle:${position.column},${position.row}`;
  obstacle.position.set(screen.x, screen.y);
  obstacle.zIndex = stableDepth(screen.y, context.projection.tileHeight, 100);
  const fallback = new Graphics()
    .roundRect(-22, -46, 44, 58, 8)
    .fill({
      color: tokenNumber(tokens.color.primitive.woodMid),
      alpha: 0.95,
    })
    .stroke({ color: tokenNumber(tokens.color.primitive.gold), width: 3 });
  fallback.eventMode = "none";
  obstacle.addChild(fallback);
  context.layers.object.addChild(obstacle);

  const assetId = context.catalog.obstacleAssetId;
  void addAssetSprite(context, {
    assetId,
    environmentStatusKey: assetStatusKey(assetId),
    container: obstacle,
    insertAt: 1,
    configure(sprite, asset, mirrored) {
      const targetHeight = context.catalog.obstacleTargetHeight ?? 72;
      const scale = targetHeight / asset.dimensions.height;
      sprite.scale.set(mirrored ? -scale : scale, scale);
      sprite.position.set(0, 4);
    },
    onLoaded() {
      fallback.visible = false;
    },
  }).catch((error: unknown) => {
    if (!context.isCurrent(obstacle)) return;
    console.error(`[assets] obstacle échoué: ${assetId}`, error);
  });
}

function wallFallbackPoints(segment: VisibleWallSegment): number[] {
  const width = isometricTileGeometry.halfTileWidth;
  const height = tokens.geometry.wallHeight;
  const tileHalfHeight = isometricTileGeometry.halfTileHeight;
  return segment.viewSide === "north"
    ? [
        0,
        -tileHalfHeight,
        width,
        0,
        width,
        -height,
        0,
        -tileHalfHeight - height,
      ]
    : [
        0,
        -tileHalfHeight,
        -width,
        0,
        -width,
        -height,
        0,
        -tileHalfHeight - height,
      ];
}

export function drawWall(
  context: SceneRenderContext,
  segment: VisibleWallSegment,
): void {
  const screen = gridToScreen(segment.viewPosition, context.projection);
  const wall = new Container();
  wall.eventMode = "none";
  wall.label = `wall:${segment.id}:${segment.viewSide}`;
  wall.position.set(screen.x, screen.y);
  wall.zIndex = stableDepth(
    screen.y,
    context.projection.tileHeight,
    segment.index,
  );
  const fallback = new Graphics()
    .poly(wallFallbackPoints(segment))
    .fill({
      color: tokenNumber(tokens.color.primitive.woodDark),
      alpha: 0.82,
    })
    .stroke({
      color: tokenNumber(tokens.color.primitive.gold),
      width: 2,
      alpha: 0.9,
    });
  fallback.eventMode = "none";
  wall.addChild(fallback);
  context.layers.backWall.addChild(wall);

  const assetId = context.catalog.wallAssetId;
  void addAssetSprite(context, {
    assetId,
    orientation: segment.orientation,
    environmentStatusKey: assetStatusKey(assetId, segment.orientation),
    container: wall,
    insertAt: 1,
    configure(sprite, _asset, mirrored) {
      const direction = segment.viewSide === "north" ? 1 : -1;
      const scale = context.catalog.wallScale ?? 0.58;
      sprite.scale.set(mirrored ? -scale : scale, scale);
      sprite.position.set(
        direction * isometricTileGeometry.halfTileWidth * 0.5,
        -isometricTileGeometry.halfTileHeight * 0.5,
      );
    },
    onLoaded() {
      fallback.visible = false;
    },
  }).catch((error: unknown) => {
    if (!context.isCurrent(wall)) return;
    console.error(`[assets] mur échoué: ${assetId}/${segment.id}`, error);
  });
}
