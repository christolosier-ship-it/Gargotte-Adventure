import { describe, expect, it } from "vitest";
import {
  defaultIsometricProjection,
  gridToScreen,
  screenToGrid,
  stableDepth,
} from "./projection";

const projection = {
  ...defaultIsometricProjection,
  originX: 256,
  originY: 32,
};

describe("projection isométrique", () => {
  it("projette l'origine et les quatre coins de la grille 8 × 4", () => {
    expect(gridToScreen({ column: 0, row: 0 }, projection)).toEqual({
      x: 256,
      y: 32,
    });
    expect(gridToScreen({ column: 7, row: 0 }, projection)).toEqual({
      x: 704,
      y: 256,
    });
    expect(gridToScreen({ column: 0, row: 3 }, projection)).toEqual({
      x: 64,
      y: 128,
    });
    expect(gridToScreen({ column: 7, row: 3 }, projection)).toEqual({
      x: 512,
      y: 352,
    });
  });

  it("projette le centre logique et conserve la symétrie des diagonales", () => {
    expect(gridToScreen({ column: 4, row: 2 }, projection)).toEqual({
      x: 384,
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
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const screen = gridToScreen({ column, row }, projection);
        expect(screenToGrid(screen, projection)).toEqual({ column, row });
      }
    }
  });

  it("reste dans la tuile près des quatre arêtes du losange", () => {
    const center = gridToScreen({ column: 3, row: 2 }, projection);
    const samples = [
      { x: center.x, y: center.y - 31 },
      { x: center.x + 63, y: center.y },
      { x: center.x, y: center.y + 31 },
      { x: center.x - 63, y: center.y },
    ];

    for (const sample of samples) {
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
});
