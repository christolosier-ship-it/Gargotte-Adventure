import type { GridPosition, RoomState } from "@gargotte/engine";
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
export interface GridDimensions {
  width: number;
  height: number;
}
export interface IsometricBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}
export interface CameraMargins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
export interface Viewport {
  width: number;
  height: number;
}
export interface CameraFit {
  scale: number;
  offsetX: number;
  offsetY: number;
  boardWidth: number;
  boardHeight: number;
}

export const isometricTileGeometry = {
  tileWidth: tokens.geometry.tileWidth,
  tileHeight: tokens.geometry.tileHeight,
  halfTileWidth: tokens.geometry.tileHalfWidth,
  halfTileHeight: tokens.geometry.tileHalfHeight,
} as const;

export const isometricPlaceholderTokenGeometry = {
  groundAnchorY: 0,
  shadowCenterY: 0,
  shadowRadiusX: 30,
  shadowRadiusY: 10,
  bodyCenterY: -27,
  bodyRadius: 27,
  labelCenterY: -27,
  hpCenterY: 14,
} as const;

export const defaultCameraMargins: CameraMargins = {
  left: 46 + tokens.geometry.spriteMaxWidth / 2,
  right: 46 + tokens.geometry.spriteMaxWidth / 2,
  top: 84 + tokens.geometry.spriteMaxHeight - tokens.geometry.tileHalfHeight,
  bottom: 32 + tokens.geometry.wallHeight,
};

export const isometricDepthLayer = {
  backdrop: -3_000_000,
  floor: -2_000_000,
  object: 0,
  foreground: 1_000_000,
  interface: 3_000_000,
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

export function buildRoomProjection(
  room: Pick<RoomState, "width" | "height">,
): IsometricProjection {
  return {
    ...defaultIsometricProjection,
    originX: (room.height - 1) * isometricTileGeometry.halfTileWidth,
    originY: isometricTileGeometry.halfTileHeight,
  };
}

export function calculateIsometricGridBounds(
  dimensions: GridDimensions,
  projection = buildRoomProjection(dimensions),
): IsometricBounds {
  const points: ScreenPosition[] = [];
  for (let row = 0; row < dimensions.height; row += 1) {
    for (let column = 0; column < dimensions.width; column += 1) {
      const center = gridToScreen({ column, row }, projection);
      points.push(
        { x: center.x, y: center.y - projection.tileHeight / 2 },
        { x: center.x + projection.tileWidth / 2, y: center.y },
        { x: center.x, y: center.y + projection.tileHeight / 2 },
        { x: center.x - projection.tileWidth / 2, y: center.y },
      );
    }
  }
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

export function fitIsometricCamera(
  bounds: IsometricBounds,
  viewport: Viewport,
  margins: CameraMargins = defaultCameraMargins,
): CameraFit {
  const boardWidth = bounds.width + margins.left + margins.right;
  const boardHeight = bounds.height + margins.top + margins.bottom;
  const scale = Math.min(
    viewport.width / boardWidth,
    viewport.height / boardHeight,
  );
  return {
    scale,
    offsetX:
      Math.max(0, (viewport.width - boardWidth * scale) / 2) -
      (bounds.minX - margins.left) * scale,
    offsetY:
      Math.max(0, (viewport.height - boardHeight * scale) / 2) -
      (bounds.minY - margins.top) * scale,
    boardWidth,
    boardHeight,
  };
}

export function stableDepth(
  screenY: number,
  tileHeight: number,
  tieBreaker: number,
): number {
  return Math.round((screenY + tileHeight / 2) * 1000) + tieBreaker;
}
