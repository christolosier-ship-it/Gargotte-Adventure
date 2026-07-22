import { Polygon } from "pixi.js";
import {
  samePosition,
  type GridPosition,
  type RoomState,
} from "@gargotte/engine";
import tokens from "../../../../design/isometric/tokens.json";
import { isometricTileGeometry } from "../projection";

export type TileState =
  "base" | "alternate" | "reachable" | "selected" | "attackable" | "blocked";

export const tileHitArea = new Polygon([
  0,
  -isometricTileGeometry.halfTileHeight,
  isometricTileGeometry.halfTileWidth,
  0,
  0,
  isometricTileGeometry.halfTileHeight,
  -isometricTileGeometry.halfTileWidth,
  0,
]);

export const combatantHitArea = new Polygon([
  -48, -96, 48, -96, 48, 12, -48, 12,
]);

export const tileStyle: Record<TileState, { color: number; alpha: number }> = {
  base: { color: tokenNumber(tokens.color.primitive.stoneDark), alpha: 1 },
  alternate: { color: tokenNumber(tokens.color.primitive.stoneMid), alpha: 1 },
  reachable: {
    color: tokenNumber(tokens.color.primitive.green),
    alpha: tokens.opacity.reachable,
  },
  selected: {
    color: tokenNumber(tokens.color.primitive.gold),
    alpha: tokens.opacity.selected,
  },
  attackable: {
    color: tokenNumber(tokens.color.primitive.danger),
    alpha: tokens.opacity.attackable,
  },
  blocked: {
    color: tokenNumber(tokens.color.primitive.woodMid),
    alpha: 0.5,
  },
};

export function diamond(): number[] {
  return [
    0,
    -isometricTileGeometry.halfTileHeight,
    isometricTileGeometry.halfTileWidth,
    0,
    0,
    isometricTileGeometry.halfTileHeight,
    -isometricTileGeometry.halfTileWidth,
    0,
  ];
}

export function tokenNumber(value: string): number {
  return Number(value.replace("#", "0x"));
}

export function resolveTileState(
  state: RoomState,
  position: GridPosition,
  reachable: boolean,
  selected: boolean,
  attackable: boolean,
): TileState {
  if (state.obstacles.some((obstacle) => samePosition(obstacle, position)))
    return "blocked";
  if (selected) return "selected";
  if (attackable) return "attackable";
  if (reachable) return "reachable";
  return (position.column + position.row) % 2 === 0 ? "base" : "alternate";
}
