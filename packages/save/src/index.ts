import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { GameState, RoomState } from "@gargotte/engine";
import { parseSavedGameState, parseSavedRoomPayload } from "./schema";

interface SaveRecord {
  id: string;
  schemaVersion: 1;
  updatedAt: string;
  state: unknown;
}

interface GargotteDatabase extends DBSchema {
  saves: {
    key: string;
    value: SaveRecord;
  };
}

const databaseName = "gargotte-adventure";
const databaseVersion = 1;
let databasePromise: Promise<IDBPDatabase<GargotteDatabase>> | null = null;

function getDatabase(): Promise<IDBPDatabase<GargotteDatabase>> {
  databasePromise ??= openDB<GargotteDatabase>(databaseName, databaseVersion, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("saves"))
        database.createObjectStore("saves", { keyPath: "id" });
    },
  });
  return databasePromise;
}

function saveRecord(id: string, state: unknown): SaveRecord {
  return {
    id,
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    state,
  };
}

export async function saveGameState(state: GameState): Promise<void> {
  const database = await getDatabase();
  await database.put("saves", saveRecord("autosave", state));
}

export async function loadGameState(): Promise<GameState | null> {
  try {
    const database = await getDatabase();
    const save = await database.get("saves", "autosave");
    return parseSavedGameState(save?.state);
  } catch (error) {
    console.error("[save] lecture de l’état d’application échouée", error);
    return null;
  }
}

export async function clearGameState(): Promise<void> {
  const database = await getDatabase();
  await database.delete("saves", "autosave");
}

export interface SavedRoomPayload {
  kind: "tactical-room";
  version: 4;
  room: RoomState;
  selectedHeroIds: string[];
}

export async function saveRoomState(payload: SavedRoomPayload): Promise<void> {
  const database = await getDatabase();
  await database.put("saves", saveRecord("room-autosave", payload));
}

export async function loadRoomState(): Promise<
  SavedRoomPayload | "legacy" | null
> {
  try {
    const database = await getDatabase();
    const save = await database.get("saves", "room-autosave");
    if (!save) {
      const old = await database.get("saves", "autosave");
      return parseSavedGameState(old?.state) ? "legacy" : null;
    }
    return parseSavedRoomPayload(save.state);
  } catch (error) {
    console.error("[save] lecture de la salle tactique échouée", error);
    return null;
  }
}

export async function clearRoomState(): Promise<void> {
  const database = await getDatabase();
  await database.delete("saves", "room-autosave");
}

export {
  gameStateSchema,
  roomStateSchema,
  savedRoomPayloadSchema,
} from "./schema";
