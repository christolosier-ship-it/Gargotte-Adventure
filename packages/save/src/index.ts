import { openDB, type DBSchema } from "idb";
import type { GameState, RoomState } from "@gargotte/engine";

interface GargotteDatabase extends DBSchema {
  saves: {
    key: string;
    value: {
      id: string;
      schemaVersion: 1;
      updatedAt: string;
      state: GameState | SavedRoomPayload;
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
  if (state && typeof state === "object" && "phase" in state) return state;
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
    const state = save?.state;
    if (!state) {
      const old = await database.get("saves", "autosave");
      return old ? "legacy" : null;
    }
    if (
      typeof state === "object" &&
      "kind" in state &&
      state.kind === "tactical-room" &&
      state.version === 1
    )
      return state;
    return null;
  } catch {
    return null;
  }
}
export async function clearRoomState(): Promise<void> {
  const database = await getDatabase();
  await database.delete("saves", "room-autosave");
}
