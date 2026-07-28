import type {
  ExpeditionDefinition,
  ExpeditionRoomDefinition,
  RoomConnectionDefinition,
  TacticalRoomDefinition,
} from "@gargotte/content-schema";
import {
  createExpeditionState,
  getNextRoomId,
  isTransitionAvailable,
  persistentHeroesFromRoom,
  startExpedition,
  synchronizeCurrentRoom,
  transitionExpedition,
  type CreatureDefinition,
  type ExpeditionState,
  type InteractableDefinition,
  type RoomState,
  type TacticalEvent,
} from "@gargotte/engine";
import { buildTacticalRoomWithEvents } from "./room-builder";

interface ExpeditionSessionOptions {
  definition: ExpeditionDefinition;
  roomDefinitions: readonly TacticalRoomDefinition[];
  creatureDefinitions: readonly CreatureDefinition[];
  interactableDefinitions: readonly InteractableDefinition[];
  restored: ExpeditionState | null;
}

export interface ExpeditionRoomBuild {
  room: RoomState;
  events: TacticalEvent[];
  restored: boolean;
}

export class ExpeditionSession {
  private readonly definition: ExpeditionDefinition;
  private readonly roomsById: ReadonlyMap<string, TacticalRoomDefinition>;
  private readonly creatureDefinitions: readonly CreatureDefinition[];
  private readonly interactableDefinitions: readonly InteractableDefinition[];
  private state: ExpeditionState | null;

  constructor(options: ExpeditionSessionOptions) {
    this.definition = options.definition;
    this.roomsById = new Map(
      options.roomDefinitions.map((room) => [room.id, room]),
    );
    this.creatureDefinitions = options.creatureDefinitions;
    this.interactableDefinitions = options.interactableDefinitions;
    this.state = options.restored;
    if (this.state?.definitionId !== this.definition.id)
      throw new Error(
        "La sauvegarde ne correspond pas au micro-donjon chargé.",
      );
  }

  get expedition(): ExpeditionState | null {
    return this.state;
  }

  get room(): RoomState | null {
    if (!this.state?.currentRoomId) return null;
    return this.state.roomStates[this.state.currentRoomId] ?? null;
  }

  get roomDefinition(): TacticalRoomDefinition | null {
    if (!this.state?.currentRoomId) return null;
    return this.roomsById.get(this.state.currentRoomId) ?? null;
  }

  get roomMetadata(): ExpeditionRoomDefinition | null {
    if (!this.state?.currentRoomId) return null;
    return (
      this.definition.rooms.find(
        (room) => room.id === this.state?.currentRoomId,
      ) ?? null
    );
  }

  get connection(): RoomConnectionDefinition | null {
    if (!this.state?.currentRoomId) return null;
    return (
      this.definition.connections.find(
        (connection) => connection.fromRoomId === this.state?.currentRoomId,
      ) ?? null
    );
  }

  get canTransition(): boolean {
    return this.state ? isTransitionAvailable(this.state) : false;
  }

  start(
    expeditionId: string,
    selectedHeroIds: readonly string[],
  ): ExpeditionRoomBuild {
    const firstRoomId = this.definition.entryRoomId;
    const built = this.buildRoom(firstRoomId, selectedHeroIds, []);
    const prepared = createExpeditionState({
      id: expeditionId,
      definitionId: this.definition.id,
      selectedHeroIds,
      orderedRoomIds: this.definition.roomIds,
      persistentHeroes: persistentHeroesFromRoom(built.state, selectedHeroIds),
    });
    this.state = startExpedition(prepared, firstRoomId, built.state);
    return { room: built.state, events: built.events, restored: false };
  }

  synchronize(room: RoomState): ExpeditionState {
    if (!this.state) throw new Error("Aucune expédition active.");
    this.state = synchronizeCurrentRoom(this.state, room);
    return this.state;
  }

  transition(): ExpeditionRoomBuild {
    if (!this.state) throw new Error("Aucune expédition active.");
    const targetRoomId = getNextRoomId(this.state);
    if (!targetRoomId) throw new Error("Aucune salle suivante.");
    const existing = this.state.roomStates[targetRoomId];
    if (existing) {
      this.state = transitionExpedition(this.state, existing);
      return { room: existing, events: [], restored: true };
    }
    const built = this.buildRoom(
      targetRoomId,
      this.state.selectedHeroIds,
      this.state.persistentHeroes,
    );
    this.state = transitionExpedition(this.state, built.state);
    return { room: built.state, events: built.events, restored: false };
  }

  private buildRoom(
    roomId: string,
    selectedHeroIds: readonly string[],
    persistentHeroes: ExpeditionState["persistentHeroes"],
  ) {
    const definition = this.roomsById.get(roomId);
    if (!definition) throw new Error(`Contenu de salle absent: ${roomId}.`);
    return buildTacticalRoomWithEvents(
      definition,
      this.creatureDefinitions,
      this.interactableDefinitions,
      selectedHeroIds,
      persistentHeroes,
    );
  }
}
