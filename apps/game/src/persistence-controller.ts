import type { GameState, RoomState } from "@gargotte/engine";
import {
  loadGameState,
  loadRoomState,
  saveGameState,
  saveRoomState,
} from "@gargotte/save";

export interface RestoredSession {
  gameState: GameState | null;
  room: RoomState | null;
  selectedHeroIds: string[];
  roomWasRestored: boolean;
}

export async function restoreSession(
  validHeroIds: ReadonlySet<string>,
  defaultHeroId: string,
): Promise<RestoredSession> {
  const [gameState, storedRoom] = await Promise.all([
    loadGameState(),
    loadRoomState(),
  ]);
  if (!storedRoom || storedRoom === "legacy")
    return {
      gameState,
      room: null,
      selectedHeroIds: [defaultHeroId],
      roomWasRestored: false,
    };

  const selectedHeroIds = storedRoom.selectedHeroIds.filter((id) =>
    validHeroIds.has(id),
  );
  return {
    gameState,
    room: storedRoom.room,
    selectedHeroIds:
      selectedHeroIds.length > 0 ? selectedHeroIds : [defaultHeroId],
    roomWasRestored: true,
  };
}

export class PersistenceController {
  private pending: Promise<void> = Promise.resolve();

  save(
    state: GameState,
    room: RoomState | null,
    selectedHeroIds: string[],
  ): Promise<void> {
    const selected = [...selectedHeroIds];
    this.pending = this.pending
      .catch(() => undefined)
      .then(async () => {
        if (room)
          await saveRoomState({
            kind: "tactical-room",
            version: 5,
            room,
            selectedHeroIds: selected,
          });
        await saveGameState(state);
      });
    return this.pending;
  }
}
