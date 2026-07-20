import { openDB, type DBSchema } from 'idb';
import type { GameState } from '@gargotte/engine';

interface GargotteDatabase extends DBSchema {
  saves: {
    key: string;
    value: {
      id: string;
      schemaVersion: 1;
      updatedAt: string;
      state: GameState;
    };
  };
  settings: {
    key: string;
    value: boolean | number | string;
  };
}

const databaseName = 'gargotte-adventure';
const databaseVersion = 1;

async function getDatabase() {
  return openDB<GargotteDatabase>(databaseName, databaseVersion, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('saves')) {
        database.createObjectStore('saves', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings');
      }
    }
  });
}

export async function saveGameState(state: GameState): Promise<void> {
  const database = await getDatabase();
  await database.put('saves', {
    id: 'autosave',
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    state
  });
}

export async function loadGameState(): Promise<GameState | null> {
  const database = await getDatabase();
  const save = await database.get('saves', 'autosave');
  return save?.state ?? null;
}

export async function clearGameState(): Promise<void> {
  const database = await getDatabase();
  await database.delete('saves', 'autosave');
}
