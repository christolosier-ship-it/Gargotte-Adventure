import type { GridPosition } from "@gargotte/engine";

export type CameraRotation = 0 | 90 | 180 | 270;
export type RoomSide = "north" | "east" | "south" | "west";
export type BackWallViewSide = "north" | "west";
export type WallAssetOrientation = "south-east" | "north-east";

export interface GridDimensions {
  width: number;
  height: number;
}

export interface PhysicalWallSegment {
  id: string;
  side: RoomSide;
  index: number;
  position: GridPosition;
}

export interface VisibleWallSegment extends PhysicalWallSegment {
  viewPosition: GridPosition;
  viewSide: BackWallViewSide;
  orientation: WallAssetOrientation;
}

const rotations: readonly CameraRotation[] = [0, 90, 180, 270];

export function nextCameraRotation(rotation: CameraRotation): CameraRotation {
  const index = rotations.indexOf(rotation);
  return rotations[(index + 1) % rotations.length] ?? 0;
}

export function viewDimensions(
  dimensions: GridDimensions,
  rotation: CameraRotation,
): GridDimensions {
  return rotation === 90 || rotation === 270
    ? { width: dimensions.height, height: dimensions.width }
    : { ...dimensions };
}

export function logicalToView(
  position: GridPosition,
  dimensions: GridDimensions,
  rotation: CameraRotation,
): GridPosition {
  switch (rotation) {
    case 90:
      return {
        column: position.row,
        row: dimensions.width - 1 - position.column,
      };
    case 180:
      return {
        column: dimensions.width - 1 - position.column,
        row: dimensions.height - 1 - position.row,
      };
    case 270:
      return {
        column: dimensions.height - 1 - position.row,
        row: position.column,
      };
    default:
      return { ...position };
  }
}

export function viewToLogical(
  position: GridPosition,
  dimensions: GridDimensions,
  rotation: CameraRotation,
): GridPosition {
  switch (rotation) {
    case 90:
      return {
        column: dimensions.width - 1 - position.row,
        row: position.column,
      };
    case 180:
      return {
        column: dimensions.width - 1 - position.column,
        row: dimensions.height - 1 - position.row,
      };
    case 270:
      return {
        column: position.row,
        row: dimensions.height - 1 - position.column,
      };
    default:
      return { ...position };
  }
}

export function transformRoomSide(
  side: RoomSide,
  rotation: CameraRotation,
): RoomSide {
  const order: readonly RoomSide[] = ["north", "east", "south", "west"];
  const sideIndex = order.indexOf(side);
  const quarterTurns = rotation / 90;
  return (
    order[(sideIndex - quarterTurns + order.length) % order.length] ?? side
  );
}

export function visibleBackSides(
  rotation: CameraRotation,
): readonly RoomSide[] {
  switch (rotation) {
    case 90:
      return ["north", "east"];
    case 180:
      return ["south", "east"];
    case 270:
      return ["south", "west"];
    default:
      return ["north", "west"];
  }
}

export function roomWallSegments(
  dimensions: GridDimensions,
  side: RoomSide,
): PhysicalWallSegment[] {
  const length =
    side === "north" || side === "south" ? dimensions.width : dimensions.height;
  return Array.from({ length }, (_, index) => ({
    id: `${side}:${index}`,
    side,
    index,
    position:
      side === "north"
        ? { column: index, row: 0 }
        : side === "south"
          ? { column: index, row: dimensions.height - 1 }
          : side === "east"
            ? { column: dimensions.width - 1, row: index }
            : { column: 0, row: index },
  }));
}

export function visibleWallSegments(
  dimensions: GridDimensions,
  rotation: CameraRotation,
): VisibleWallSegment[] {
  return visibleBackSides(rotation).flatMap((side) =>
    roomWallSegments(dimensions, side).map((segment) => {
      const transformedSide = transformRoomSide(side, rotation);
      if (transformedSide !== "north" && transformedSide !== "west")
        throw new Error(
          `Le mur arrière ${side} est devenu un côté non visible ${transformedSide}.`,
        );
      return {
        ...segment,
        viewPosition: logicalToView(segment.position, dimensions, rotation),
        viewSide: transformedSide,
        orientation: transformedSide === "north" ? "south-east" : "north-east",
      };
    }),
  );
}
