import { parseDungeon, parseTacticalRoom } from "@gargotte/content-schema";
import type { TabletopAssetCatalog } from "@gargotte/renderer";
import dungeonData from "../../../content/bastognac/dungeon.json";
import roomData from "../../../content/bastognac/sprint-1-room.json";

export const bastognacDungeon = parseDungeon(dungeonData);
export const bastognacRoom = parseTacticalRoom(roomData);

export const bastognacAssetCatalog: TabletopAssetCatalog = {
  canvasLabel: "Plateau tactique PixiJS de Bastognac",
  roomTitle: "BASTOGNAC · SALLE TACTIQUE",
  floorAssetIds: ["tile.bastognac-floor-a", "tile.bastognac-floor-b"],
  wallAssetId: "wall.bastognac",
  obstacleAssetId: "prop.bastognac-barrel",
  groundShadowAssetId: "common.ground-shadow",
  combatantAssetIds: {
    brunhilda: "character.brunhilda",
    "gobelin-bricoleur": "character.gobelin-bricoleur",
  },
  preload: [
    { id: "common.ground-shadow" },
    { id: "tile.fallback" },
    { id: "wall.fallback", orientation: "south-east" },
    { id: "prop.fallback-obstacle" },
    { id: "fx.impact-test" },
    { id: "tile.bastognac-floor-a" },
    { id: "tile.bastognac-floor-b" },
    { id: "wall.bastognac", orientation: "south-east" },
    { id: "wall.bastognac", orientation: "north-east" },
    { id: "prop.bastognac-barrel" },
    { id: "character.brunhilda" },
    { id: "character.gobelin-bricoleur" },
  ],
};
