import type {
  DungeonDefinition,
  TacticalRoomDefinition,
} from "@gargotte/content-schema";
import type {
  BrouhahaEffectDefinition,
  CreatureDefinition,
  InteractableDefinition,
} from "@gargotte/engine";
import type { TabletopRenderer } from "@gargotte/renderer";
import type { GameShell } from "@gargotte/ui";
import type { RestoredSession } from "./persistence-controller";

export interface GameControllerOptions {
  shell: GameShell;
  renderer: TabletopRenderer;
  dungeon: DungeonDefinition;
  roomDefinition: TacticalRoomDefinition;
  creatureDefinitions: CreatureDefinition[];
  brouhahaEffects: BrouhahaEffectDefinition[];
  interactableDefinitions: InteractableDefinition[];
  restored: RestoredSession;
}
