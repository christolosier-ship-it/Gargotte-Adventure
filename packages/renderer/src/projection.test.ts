import { describe, expect, it } from "vitest";
import {
  buildRoomProjection,
  calculateIsometricGridBounds,
  defaultCameraMargins,
  defaultIsometricProjection,
  fitIsometricCamera,
  gridToScreen,
  isometricDepthLayer,
  isometricPlaceholderTokenGeometry,
  screenToGrid,
  stableDepth,
} from "./projection";

const projection = {
  ...defaultIsometricProjection,
  originX: 192,
  originY: 32,
};

describe("projection isométrique", () => {
  it("construit une projection depuis les dimensions de salle", () => {
    expect(buildRoomProjection({ width: 8, height: 4 })).toEqual(projection);
    expect(buildRoomProjection({ width: 5, height: 6 }).originX).toBe(320);
  });

  it("projette l'origine et les quatre coins de la grille 8 × 4", () => {
    expect(gridToScreen({ column: 0, row: 0 }, projection)).toEqual({
      x: 192,
      y: 32,
    });
    expect(gridToScreen({ column: 7, row: 0 }, projection)).toEqual({
      x: 640,
      y: 256,
    });
    expect(gridToScreen({ column: 0, row: 3 }, projection)).toEqual({
      x: 0,
      y: 128,
    });
    expect(gridToScreen({ column: 7, row: 3 }, projection)).toEqual({
      x: 448,
      y: 352,
    });
  });

  it("calcule les bornes du losange complet depuis width et height", () => {
    expect(
      calculateIsometricGridBounds({ width: 8, height: 4 }, projection),
    ).toEqual({
      minX: -64,
      maxX: 704,
      minY: 0,
      maxY: 384,
      width: 768,
      height: 384,
    });
  });

  it("calcule un fit caméra centré avec marges de sécurité", () => {
    const bounds = calculateIsometricGridBounds(
      { width: 8, height: 4 },
      projection,
    );
    const camera = fitIsometricCamera(bounds, { width: 1200, height: 700 });
    expect(camera.boardWidth).toBe(
      bounds.width + defaultCameraMargins.left + defaultCameraMargins.right,
    );
    expect(camera.boardHeight).toBe(
      bounds.height + defaultCameraMargins.top + defaultCameraMargins.bottom,
    );
    expect(camera.scale).toBeGreaterThan(0);
    expect(camera.offsetX).toBeGreaterThan(0);
  });

  it("projette le centre logique et conserve la symétrie des diagonales", () => {
    expect(gridToScreen({ column: 4, row: 2 }, projection)).toEqual({
      x: 320,
      y: 224,
    });
    expect(gridToScreen({ column: 2, row: 0 }, projection).y).toBe(
      gridToScreen({ column: 1, row: 1 }, projection).y,
    );
    expect(gridToScreen({ column: 0, row: 2 }, projection).x).toBe(
      gridToScreen({ column: 1, row: 3 }, projection).x,
    );
  });

  it("retrouve le centre de chaque tuile par conversion inverse", () => {
    for (let row = 0; row < 4; row += 1)
      for (let column = 0; column < 8; column += 1)
        expect(
          screenToGrid(gridToScreen({ column, row }, projection), projection),
        ).toEqual({ column, row });
  });

  it("reste dans la tuile près des quatre arêtes du losange", () => {
    const center = gridToScreen({ column: 3, row: 2 }, projection);
    for (const sample of [
      { x: center.x, y: center.y - 31 },
      { x: center.x + 63, y: center.y },
      { x: center.x, y: center.y + 31 },
      { x: center.x - 63, y: center.y },
    ]) {
      const picked = screenToGrid(sample, projection);
      expect(Math.round(picked.column)).toBe(3);
      expect(Math.round(picked.row)).toBe(2);
    }
  });

  it("trie deux sprites de même screenY avec un départage stable", () => {
    const left = gridToScreen({ column: 2, row: 0 }, projection);
    const right = gridToScreen({ column: 1, row: 1 }, projection);
    expect(left.y).toBe(right.y);
    expect(stableDepth(left.y, projection.tileHeight, 2)).toBeLessThan(
      stableDepth(right.y, projection.tileHeight, 3),
    );
  });

  it("maintient toutes les tuiles sous tous les objets, même hors grille 8 × 4", () => {
    const deepestFloor = gridToScreen({ column: 11, row: 6 }, projection);
    const nearestObject = gridToScreen({ column: 0, row: 0 }, projection);
    const floorDepth =
      isometricDepthLayer.floor +
      stableDepth(deepestFloor.y, projection.tileHeight, 0);
    const objectDepth =
      isometricDepthLayer.object +
      stableDepth(nearestObject.y, projection.tileHeight, 0);
    expect(floorDepth).toBeLessThan(objectDepth);
    expect(isometricDepthLayer.backdrop).toBeLessThan(floorDepth);
    expect(isometricDepthLayer.foreground).toBeGreaterThan(objectDepth);
    expect(isometricDepthLayer.interface).toBeGreaterThan(
      isometricDepthLayer.foreground,
    );
  });

  it("place le bas du pion et son ombre sur le centre projeté de la case", () => {
    expect(
      isometricPlaceholderTokenGeometry.bodyCenterY +
        isometricPlaceholderTokenGeometry.bodyRadius,
    ).toBe(isometricPlaceholderTokenGeometry.groundAnchorY);
    expect(isometricPlaceholderTokenGeometry.shadowCenterY).toBeCloseTo(
      isometricPlaceholderTokenGeometry.groundAnchorY,
      0,
    );
  });
});
