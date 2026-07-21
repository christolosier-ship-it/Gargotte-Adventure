import { openDB, type DBSchema } from "idb";
import type { GameState, RoomState } from "@gargotte/engine";

interface GargotteDatabase extends DBSchema {
  saves: {
    key: string;
    value: {
      id: string;
      schemaVersion: 1;
      updatedAt: string;
      state: GameState | SavedRoomPayload | unknown;
    };
  };
  settings: {
    key: string;
    value: boolean | number | string;
  };
}

const databaseName = "gargotte-adventure";
const databaseVersion = 1;

async function getDatabase() {
  return openDB<GargotteDatabase>(databaseName, databaseVersion, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("saves")) {
        database.createObjectStore("saves", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("settings")) {
        database.createObjectStore("settings");
      }
    },
  });
}

export async function saveGameState(state: GameState): Promise<void> {
  const database = await getDatabase();
  await database.put("saves", {
    id: "autosave",
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    state,
  });
}

export async function loadGameState(): Promise<GameState | null> {
  const database = await getDatabase();
  const save = await database.get("saves", "autosave");
  const state = save?.state;
  if (state && typeof state === "object" && "phase" in state)
    return state as GameState;
  return null;
}

export async function clearGameState(): Promise<void> {
  const database = await getDatabase();
  await database.delete("saves", "autosave");
}

export interface SavedRoomPayload {
  kind: "tactical-room";
  version: 1;
  room: RoomState;
  selectedHeroIds: string[];
}

function isRoomState(value: unknown): value is RoomState {
  if (!value || typeof value !== "object") return false;
  const room = value as Partial<RoomState>;
  return (
    room.version === 1 &&
    typeof room.scenarioId === "string" &&
    Number.isInteger(room.width) &&
    Number.isInteger(room.height) &&
    Array.isArray(room.obstacles) &&
    Array.isArray(room.heroes) &&
    Array.isArray(room.enemies) &&
    (room.activeHeroId === null || typeof room.activeHeroId === "string") &&
    ["heroes-turn", "enemy-turn", "victory", "defeat"].includes(
      room.phase ?? "",
    ) &&
    Number.isInteger(room.turn)
  );
}

function isSavedRoomPayload(value: unknown): value is SavedRoomPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<SavedRoomPayload>;
  return (
    payload.kind === "tactical-room" &&
    payload.version === 1 &&
    isRoomState(payload.room) &&
    Array.isArray(payload.selectedHeroIds) &&
    payload.selectedHeroIds.every((id) => typeof id === "string")
  );
}

export async function saveRoomState(payload: SavedRoomPayload): Promise<void> {
  const database = await getDatabase();
  await database.put("saves", {
    id: "room-autosave",
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    state: payload,
  });
}

export async function loadRoomState(): Promise<
  SavedRoomPayload | "legacy" | null
> {
  try {
    const database = await getDatabase();
    const save = await database.get("saves", "room-autosave");
    if (!save) {
      const old = await database.get("saves", "autosave");
      return old ? "legacy" : null;
    }
    return isSavedRoomPayload(save.state) ? save.state : null;
  } catch {
    return null;
  }
}

export async function clearRoomState(): Promise<void> {
  const database = await getDatabase();
  await database.delete("saves", "room-autosave");
}
