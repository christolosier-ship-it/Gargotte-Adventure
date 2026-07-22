import { describe, expect, it } from "vitest";
import {
  logicalToView,
  nextCameraRotation,
  roomWallSegments,
  transformRoomSide,
  viewDimensions,
  viewToLogical,
  visibleBackSides,
  visibleWallSegments,
  type CameraRotation,
} from "./view";

const dimensions = { width: 8, height: 4 };
const rotations: readonly CameraRotation[] = [0, 90, 180, 270];

describe("vue caméra isométrique", () => {
  it("pivote par quarts de tour et revient à l'origine", () => {
    let rotation: CameraRotation = 0;
    for (const expected of [90, 180, 270, 0] as const) {
      rotation = nextCameraRotation(rotation);
      expect(rotation).toBe(expected);
    }
  });

  it("échange les dimensions visuelles à 90° et 270°", () => {
    expect(viewDimensions(dimensions, 0)).toEqual({ width: 8, height: 4 });
    expect(viewDimensions(dimensions, 90)).toEqual({ width: 4, height: 8 });
    expect(viewDimensions(dimensions, 180)).toEqual({ width: 8, height: 4 });
    expect(viewDimensions(dimensions, 270)).toEqual({ width: 4, height: 8 });
  });

  it("transforme chaque case puis retrouve exactement sa position logique", () => {
    for (const rotation of rotations)
      for (let row = 0; row < dimensions.height; row += 1)
        for (let column = 0; column < dimensions.width; column += 1) {
          const logical = { column, row };
          const viewed = logicalToView(logical, dimensions, rotation);
          expect(viewToLogical(viewed, dimensions, rotation)).toEqual(logical);
        }
  });

  it("fait tourner les quatre coins de la salle", () => {
    expect(logicalToView({ column: 0, row: 0 }, dimensions, 90)).toEqual({
      column: 0,
      row: 7,
    });
    expect(logicalToView({ column: 7, row: 0 }, dimensions, 90)).toEqual({
      column: 0,
      row: 0,
    });
    expect(logicalToView({ column: 7, row: 3 }, dimensions, 180)).toEqual({
      column: 0,
      row: 0,
    });
    expect(logicalToView({ column: 0, row: 3 }, dimensions, 270)).toEqual({
      column: 0,
      row: 0,
    });
  });

  it("sélectionne uniquement les deux murs arrière de chaque vue", () => {
    expect(visibleBackSides(0)).toEqual(["north", "west"]);
    expect(visibleBackSides(90)).toEqual(["north", "east"]);
    expect(visibleBackSides(180)).toEqual(["south", "east"]);
    expect(visibleBackSides(270)).toEqual(["south", "west"]);
  });

  it("conserve des identifiants physiques stables pour les futurs éléments muraux", () => {
    expect(roomWallSegments(dimensions, "north").map((wall) => wall.id)).toEqual(
      Array.from({ length: 8 }, (_, index) => `north:${index}`),
    );
    expect(roomWallSegments(dimensions, "east").map((wall) => wall.id)).toEqual(
      Array.from({ length: 4 }, (_, index) => `east:${index}`),
    );
  });

  it("projette tous les murs visibles sur les côtés nord ou ouest de la vue", () => {
    for (const rotation of rotations) {
      const segments = visibleWallSegments(dimensions, rotation);
      expect(segments).toHaveLength(dimensions.width + dimensions.height);
      expect(new Set(segments.map((segment) => segment.id)).size).toBe(
        segments.length,
      );
      expect(
        segments.every(
          (segment) =>
            segment.viewSide === "north" || segment.viewSide === "west",
        ),
      ).toBe(true);
      expect(
        segments.every((segment) =>
          segment.viewSide === "north"
            ? segment.viewPosition.row === 0
            : segment.viewPosition.column === 0,
        ),
      ).toBe(true);
    }
  });

  it("fait suivre un élément mural fictif à son mur physique", () => {
    const northDoor = roomWallSegments(dimensions, "north")[4];
    expect(northDoor?.id).toBe("north:4");
    expect(visibleWallSegments(dimensions, 0).some((wall) => wall.id === northDoor?.id)).toBe(true);
    expect(visibleWallSegments(dimensions, 90).some((wall) => wall.id === northDoor?.id)).toBe(true);
    expect(visibleWallSegments(dimensions, 180).some((wall) => wall.id === northDoor?.id)).toBe(false);
    expect(visibleWallSegments(dimensions, 270).some((wall) => wall.id === northDoor?.id)).toBe(false);
  });

  it("fait correspondre les côtés physiques aux côtés visuels attendus", () => {
    expect(transformRoomSide("north", 90)).toBe("west");
    expect(transformRoomSide("east", 90)).toBe("north");
    expect(transformRoomSide("south", 180)).toBe("north");
    expect(transformRoomSide("west", 270)).toBe("north");
  });

  it("reste dynamique pour des salles rectangulaires variées", () => {
    for (const room of [
      { width: 5, height: 6 },
      { width: 12, height: 3 },
      { width: 1, height: 7 },
    ])
      for (const rotation of rotations) {
        const walls = visibleWallSegments(room, rotation);
        expect(walls).toHaveLength(room.width + room.height);
        const viewed = viewDimensions(room, rotation);
        expect(
          walls.every(
            (wall) =>
              wall.viewPosition.column >= 0 &&
              wall.viewPosition.column < viewed.width &&
              wall.viewPosition.row >= 0 &&
              wall.viewPosition.row < viewed.height,
          ),
        ).toBe(true);
      }
  });
});
