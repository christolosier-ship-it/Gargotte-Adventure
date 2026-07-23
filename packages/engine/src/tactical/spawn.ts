import { isBlocked, isWithinBounds } from "./grid";
import type { TacticalEvent } from "./events";
import type {
  CreatureDefinition,
  CreatureInstance,
  RoomState,
  SpawnPoint,
  SpawnRejection,
  SpawnRejectionReason,
  SpawnRequest,
} from "./types";

export interface SpawnResult {
  state: RoomState;
  created: CreatureInstance[];
  rejected: SpawnRejection[];
  events: TacticalEvent[];
}

export function spawnCreatures(
  state: RoomState,
  creatureDefinitions: readonly CreatureDefinition[],
  request: SpawnRequest,
): SpawnResult {
  const requestedEvent: TacticalEvent = {
    type: "spawn-requested",
    requestId: request.id,
    source: request.source,
    creatureId: request.creatureId,
    quantity: request.quantity,
  };

  if (state.processedSpawnRequestIds.includes(request.id))
    return rejectedResult(
      state,
      request,
      "duplicate-request",
      0,
      ["la requête a déjà produit des instances"],
      requestedEvent,
    );

  if (!Number.isInteger(request.quantity) || request.quantity <= 0)
    return rejectedResult(
      state,
      request,
      "invalid-quantity",
      0,
      ["la quantité doit être un entier strictement positif"],
      requestedEvent,
    );

  if (state.phase === "victory" || state.phase === "defeat")
    return rejectedResult(
      state,
      request,
      "terminal-room",
      0,
      [`la salle est déjà en phase ${state.phase}`],
      requestedEvent,
    );

  const definition = creatureDefinitions.find(
    (candidate) => candidate.id === request.creatureId,
  );
  if (!definition)
    return rejectedResult(
      state,
      request,
      "creature-not-found",
      0,
      [`définition absente: ${request.creatureId}`],
      requestedEvent,
    );

  const { valid, details } = validSpawnPoints(state, request);
  if (request.failureMode === "all-or-nothing" && valid.length < request.quantity)
    return rejectedResult(
      state,
      request,
      "not-enough-valid-points",
      valid.length,
      details,
      requestedEvent,
    );

  const selectedPoints = valid.slice(0, request.quantity);
  if (selectedPoints.length === 0)
    return rejectedResult(
      state,
      request,
      "not-enough-valid-points",
      0,
      details,
      requestedEvent,
    );

  const existingIds = new Set([
    ...state.heroes.map((hero) => hero.id),
    ...state.enemies.map((enemy) => enemy.id),
  ]);
  let nextSequence = state.nextEnemyInstanceSequence;
  const created: CreatureInstance[] = [];

  for (const point of selectedPoints) {
    const generated = nextInstanceId(
      definition.id,
      nextSequence,
      existingIds,
    );
    nextSequence = generated.nextSequence;
    existingIds.add(generated.id);
    created.push({
      id: generated.id,
      creatureId: definition.id,
      name: definition.name,
      kind: "enemy",
      position: point.position,
      hp: definition.maxHp,
      maxHp: definition.maxHp,
      atk: definition.atk,
      def: definition.def,
      range: definition.range,
      alive: definition.maxHp > 0,
      blocksMovement: definition.blocksMovement,
    });
  }

  const nextState: RoomState = {
    ...state,
    enemies: [...state.enemies, ...created],
    processedSpawnRequestIds: [...state.processedSpawnRequestIds, request.id],
    nextEnemyInstanceSequence: nextSequence,
  };
  const events: TacticalEvent[] = [
    requestedEvent,
    ...created.map<TacticalEvent>((instance) => ({
      type: "creature-instantiated",
      requestId: request.id,
      creatureId: instance.creatureId,
      instanceId: instance.id,
      position: instance.position,
    })),
    {
      type: "spawn-succeeded",
      requestId: request.id,
      creatureId: request.creatureId,
      requested: request.quantity,
      createdInstanceIds: created.map((instance) => instance.id),
    },
  ];
  const rejected: SpawnRejection[] = [];

  if (created.length < request.quantity) {
    const rejection = createRejection(
      request,
      "not-enough-valid-points",
      valid.length,
      details,
    );
    rejected.push(rejection);
    events.push(rejectionEvent(rejection));
  }

  return { state: nextState, created, rejected, events };
}

function validSpawnPoints(
  state: RoomState,
  request: SpawnRequest,
): { valid: SpawnPoint[]; details: string[] } {
  const byId = new Map(state.spawnPoints.map((point) => [point.id, point]));
  const seenIds = new Set<string>();
  const seenPositions = new Set<string>();
  const valid: SpawnPoint[] = [];
  const details: string[] = [];

  for (const id of request.candidateSpawnPointIds) {
    if (seenIds.has(id)) {
      details.push(`${id}: candidat dupliqué ignoré`);
      continue;
    }
    seenIds.add(id);
    const point = byId.get(id);
    if (!point) {
      details.push(`${id}: point absent`);
      continue;
    }
    if (!point.enabled) {
      details.push(`${id}: point désactivé`);
      continue;
    }
    if (!isWithinBounds(point.position, state.width, state.height)) {
      details.push(`${id}: position hors plateau`);
      continue;
    }
    if (isBlocked(state, point.position)) {
      details.push(`${id}: position occupée ou bloquée`);
      continue;
    }
    const positionKey = `${point.position.column},${point.position.row}`;
    if (seenPositions.has(positionKey)) {
      details.push(`${id}: position déjà retenue par un autre point`);
      continue;
    }
    seenPositions.add(positionKey);
    valid.push(point);
  }

  return { valid, details };
}

function nextInstanceId(
  creatureId: string,
  sequence: number,
  existingIds: ReadonlySet<string>,
): { id: string; nextSequence: number } {
  let current = sequence;
  let id = `${creatureId}-spawn-${current}`;
  while (existingIds.has(id)) {
    current += 1;
    id = `${creatureId}-spawn-${current}`;
  }
  return { id, nextSequence: current + 1 };
}

function createRejection(
  request: SpawnRequest,
  reason: SpawnRejectionReason,
  available: number,
  details: string[],
): SpawnRejection {
  return {
    requestId: request.id,
    creatureId: request.creatureId,
    reason,
    requested: request.quantity,
    available,
    details,
  };
}

function rejectionEvent(rejection: SpawnRejection): TacticalEvent {
  return {
    type: "spawn-rejected",
    requestId: rejection.requestId,
    creatureId: rejection.creatureId,
    reason: rejection.reason,
    requested: rejection.requested,
    available: rejection.available,
    details: rejection.details,
  };
}

function rejectedResult(
  state: RoomState,
  request: SpawnRequest,
  reason: SpawnRejectionReason,
  available: number,
  details: string[],
  requestedEvent: TacticalEvent,
): SpawnResult {
  const rejection = createRejection(request, reason, available, details);
  return {
    state,
    created: [],
    rejected: [rejection],
    events: [requestedEvent, rejectionEvent(rejection)],
  };
}
