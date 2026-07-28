import {
  parseBrouhahaEffectCatalog,
  parseCreatureCatalog,
  parseDungeon,
  parseExpeditionDefinition,
  parseInteractableCatalog,
  parseTacticalRoom,
  type TacticalRoomDefinition,
} from "@gargotte/content-schema";
import type {
  BrouhahaEffectDefinition,
  CreatureDefinition,
  InteractableDefinition,
} from "@gargotte/engine";
import type { TabletopAssetCatalog } from "@gargotte/renderer";
import brouhahaEffectData from "../../../content/bastognac/brouhaha-effects.json";
import creatureData from "../../../content/bastognac/creatures.json";
import dungeonData from "../../../content/bastognac/dungeon.json";
import expeditionData from "../../../content/bastognac/expedition.json";
import interactableData from "../../../content/bastognac/interactables.json";
import room1Data from "../../../content/bastognac/room-1.json";
import room2Data from "../../../content/bastognac/room-2.json";
import room3Data from "../../../content/bastognac/room-3.json";

export const bastognacDungeon = parseDungeon(dungeonData);
export const bastognacExpedition = parseExpeditionDefinition(expeditionData);
export const bastognacCreatureCatalog = parseCreatureCatalog(creatureData);
export const bastognacBrouhahaEffectCatalog =
  parseBrouhahaEffectCatalog(brouhahaEffectData);
export const bastognacInteractableCatalog =
  parseInteractableCatalog(interactableData);
export const bastognacRoomDefinitions: TacticalRoomDefinition[] = [
  parseTacticalRoom(room1Data),
  parseTacticalRoom(room2Data),
  parseTacticalRoom(room3Data),
];
export const bastognacRoom = bastognacRoomDefinitions[0]!;
export const bastognacRoomsById = new Map(
  bastognacRoomDefinitions.map((room) => [room.id, room]),
);
export const bastognacCreatureDefinitions: CreatureDefinition[] =
  bastognacCreatureCatalog.creatures.map((creature) => ({
    id: creature.id,
    name: creature.name,
    maxHp: creature.maxHp,
    atk: creature.atk,
    def: creature.def,
    range: creature.range,
    blocksMovement: creature.blocksMovement,
  }));
export const bastognacBrouhahaEffects: BrouhahaEffectDefinition[] =
  bastognacBrouhahaEffectCatalog.effects;
export const bastognacInteractableDefinitions: InteractableDefinition[] =
  bastognacInteractableCatalog.interactables;

export const bastognacAssetCatalog: TabletopAssetCatalog = {
  canvasLabel: "Plateau tactique PixiJS de Bastognac",
  roomTitle: "BASTOGNAC · MICRO-DONJON",
  floorAssetIds: ["tile.bastognac-floor-a", "tile.bastognac-floor-b"],
  wallAssetId: "wall.bastognac",
  obstacleAssetId: "prop.bastognac-barrel",
  interactableAssetIds: {
    "tonneau-bastognac:intact": "prop.bastognac-barrel",
  },
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
