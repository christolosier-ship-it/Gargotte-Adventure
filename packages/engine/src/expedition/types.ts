import type { RoomState } from "../tactical";

export type ExpeditionStatus =
  "preparation" | "in-progress" | "victory" | "defeat";

export interface PersistentHeroState {
  id: string;
  hp: number;
  maxHp: number;
  alive: boolean;
}

export interface ExpeditionRoomSummary {
  roomId: string;
  turns: number;
  finalBrouhahaLevel: number;
  defeatedEnemies: number;
  completed: boolean;
}

export interface ExpeditionResult {
  outcome: "victory" | "defeat";
  totalTurns: number;
  defeatedEnemies: number;
  heroes: PersistentHeroState[];
  rooms: ExpeditionRoomSummary[];
}

export interface ExpeditionState {
  version: 1;
  id: string;
  definitionId: string;
  selectedHeroIds: string[];
  currentRoomId: string | null;
  orderedRoomIds: [string, string, string];
  visitedRoomIds: string[];
  completedRoomIds: string[];
  persistentHeroes: PersistentHeroState[];
  roomStates: Record<string, RoomState>;
  status: ExpeditionStatus;
  result: ExpeditionResult | null;
}
