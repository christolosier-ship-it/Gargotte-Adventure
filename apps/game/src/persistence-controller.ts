import {
  createExpeditionState,
  persistentHeroesFromRoom,
  startExpedition,
  type ExpeditionState,
  type GameState,
  type PersistentHeroState,
  type RoomState,
} from "@gargotte/engine";
import {
  loadExpeditionState,
  loadGameState,
  loadRoomState,
  saveExpeditionState,
  saveGameState,
} from "@gargotte/save";

export interface RestoredSession {
  gameState: GameState | null;
  expedition: ExpeditionState | null;
  selectedHeroIds: string[];
  expeditionWasRestored: boolean;
  migratedLegacyRoom: boolean;
  diagnosticMode: boolean;
}

interface RestoreSessionOptions {
  validHeroIds: ReadonlySet<string>;
  defaultHeroId: string;
  definitionId: string;
  orderedRoomIds: readonly [string, string, string];
  buildFirstRoom(
    selectedHeroIds: readonly string[],
    persistentHeroes: readonly PersistentHeroState[],
  ): RoomState;
}

export async function restoreSession(
  options: RestoreSessionOptions,
): Promise<RestoredSession> {
  const [gameState, storedExpedition] = await Promise.all([
    loadGameState(),
    loadExpeditionState(),
  ]);
  if (storedExpedition) {
    const selected = storedExpedition.expedition.selectedHeroIds.filter((id) =>
      options.validHeroIds.has(id),
    );
    if (selected.length === storedExpedition.expedition.selectedHeroIds.length)
      return {
        gameState,
        expedition: storedExpedition.expedition,
        selectedHeroIds: selected,
        expeditionWasRestored: true,
        migratedLegacyRoom: false,
        diagnosticMode: storedExpedition.diagnosticMode,
      };
  }

  const storedRoom = await loadRoomState();
  if (storedRoom && storedRoom !== "legacy") {
    const selected = storedRoom.selectedHeroIds.filter((id) =>
      options.validHeroIds.has(id),
    );
    const selectedHeroIds =
      selected.length > 0 ? selected : [options.defaultHeroId];
    const persistentHeroes = persistentHeroesFromRoom(
      storedRoom.room,
      selectedHeroIds,
    );
    const firstRoom = options.buildFirstRoom(
      selectedHeroIds,
      persistentHeroes,
    );
    const prepared = createExpeditionState({
      id: `${options.definitionId}-migration-1`,
      definitionId: options.definitionId,
      selectedHeroIds,
      orderedRoomIds: options.orderedRoomIds,
      persistentHeroes,
    });
    return {
      gameState,
      expedition: startExpedition(
        prepared,
        options.orderedRoomIds[0],
        firstRoom,
      ),
      selectedHeroIds,
      expeditionWasRestored: true,
      migratedLegacyRoom: true,
      diagnosticMode: false,
    };
  }

  return {
    gameState,
    expedition: null,
    selectedHeroIds: [options.defaultHeroId],
    expeditionWasRestored: false,
    migratedLegacyRoom: false,
    diagnosticMode: false,
  };
}

export class PersistenceController {
  private pending: Promise<void> = Promise.resolve();

  save(
    state: GameState,
    expedition: ExpeditionState | null,
    diagnosticMode: boolean,
  ): Promise<void> {
    this.pending = this.pending
      .catch(() => undefined)
      .then(async () => {
        if (expedition)
          await saveExpeditionState({
            kind: "expedition",
            version: 1,
            expedition,
            diagnosticMode,
          });
        await saveGameState(state);
      });
    return this.pending;
  }
}
