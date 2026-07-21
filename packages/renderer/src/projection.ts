import type { GridPosition } from "@gargotte/engine";
import tokens from "../../../design/isometric/tokens.json";

export interface IsometricProjection {
  tileWidth: number;
  tileHeight: number;
  originX: number;
  originY: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export const isometricTileGeometry = {
  tileWidth: tokens.geometry.tileWidth,
  tileHeight: tokens.geometry.tileHeight,
  halfTileWidth: tokens.geometry.tileHalfWidth,
  halfTileHeight: tokens.geometry.tileHalfHeight,
} as const;

export const defaultIsometricProjection: IsometricProjection = {
  tileWidth: isometricTileGeometry.tileWidth,
  tileHeight: isometricTileGeometry.tileHeight,
  originX: 0,
  originY: 0,
};

export function gridToScreen(
  position: GridPosition,
  projection: IsometricProjection,
): ScreenPosition {
  return {
    x:
      projection.originX +
      ((position.column - position.row) * projection.tileWidth) / 2,
    y:
      projection.originY +
      ((position.column + position.row) * projection.tileHeight) / 2,
  };
}

export function screenToGrid(
  position: ScreenPosition,
  projection: IsometricProjection,
): { column: number; row: number } {
  const localX = position.x - projection.originX;
  const localY = position.y - projection.originY;

  return {
    column: localX / projection.tileWidth + localY / projection.tileHeight,
    row: localY / projection.tileHeight - localX / projection.tileWidth,
  };
}

export function stableDepth(
  screenY: number,
  tileHeight: number,
  tieBreaker: number,
): number {
  return Math.round((screenY + tileHeight / 2) * 1000) + tieBreaker;
}
