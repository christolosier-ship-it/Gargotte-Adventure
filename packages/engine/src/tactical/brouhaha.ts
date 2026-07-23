import type { TacticalEvent } from "./events";
import type {
  BrouhahaEffectDefinition,
  BrouhahaHistoryEntry,
  BrouhahaRejection,
  BrouhahaRequest,
  BrouhahaState,
  RoomState,
} from "./types";

export const BROUHAHA_MIN_LEVEL = 0;
export const BROUHAHA_MAX_LEVEL = 12;

export interface BrouhahaContext {
  dungeonId: string;
}

export interface BrouhahaResult {
  state: RoomState;
  events: TacticalEvent[];
  effects: BrouhahaEffectDefinition[];
  rejection: BrouhahaRejection | null;
}

export function createInitialBrouhahaState(): BrouhahaState {
  return {
    level: BROUHAHA_MIN_LEVEL,
    processedRequestIds: [],
    nextResolutionSequence: 1,
    history: [],
  };
}

export function effectCountForBrouhahaLevel(level: number): 1 | 2 {
  return level >= 10 ? 2 : 1;
}

export function changeBrouhaha(
  state: RoomState,
  effectDefinitions: readonly BrouhahaEffectDefinition[],
  request: BrouhahaRequest,
  context: BrouhahaContext,
): BrouhahaResult {
  const requestedEvent: TacticalEvent = {
    type: "brouhaha-change-requested",
    requestId: request.id,
    source: request.source,
    delta: request.delta,
    reason: request.reason,
  };

  if (state.brouhaha.processedRequestIds.includes(request.id))
    return reject(
      state,
      request,
      "duplicate-request",
      ["Cette demande a déjà été appliquée."],
      requestedEvent,
    );

  if (!Number.isInteger(request.delta) || request.delta === 0)
    return reject(
      state,
      request,
      "invalid-delta",
      ["La variation doit être un entier non nul."],
      requestedEvent,
    );

  if (state.phase === "victory" || state.phase === "defeat")
    return reject(
      state,
      request,
      "terminal-room",
      ["Le Brouhaha ne peut plus évoluer dans une salle terminée."],
      requestedEvent,
    );

  const nextLevel = clampBrouhahaLevel(state.brouhaha.level + request.delta);
  if (nextLevel === state.brouhaha.level)
    return reject(
      state,
      request,
      "no-level-change",
      [
        request.delta > 0
          ? "La jauge est déjà à son maximum."
          : "La jauge est déjà à son minimum.",
      ],
      requestedEvent,
    );

  const eligible = eligibleEffects(
    effectDefinitions,
    nextLevel,
    context.dungeonId,
  );
  const expectedCount = effectCountForBrouhahaLevel(nextLevel);
  if (eligible.length < expectedCount)
    return reject(
      state,
      request,
      "insufficient-effects",
      [
        `${eligible.length} effet(s) éligible(s) pour ${expectedCount} attendu(s) au niveau ${nextLevel}.`,
      ],
      requestedEvent,
    );

  const sequence = state.brouhaha.nextResolutionSequence;
  const effects = selectEffects(eligible, expectedCount, sequence);
  const appliedDelta = nextLevel - state.brouhaha.level;
  const historyEntry: BrouhahaHistoryEntry = {
    id: `brouhaha-resolution-${sequence}`,
    requestId: request.id,
    sequence,
    previousLevel: state.brouhaha.level,
    level: nextLevel,
    requestedDelta: request.delta,
    appliedDelta,
    source: request.source,
    reason: request.reason,
    effectIds: effects.map((effect) => effect.id),
  };

  const nextState: RoomState = {
    ...state,
    brouhaha: {
      level: nextLevel,
      processedRequestIds: [...state.brouhaha.processedRequestIds, request.id],
      nextResolutionSequence: sequence + 1,
      history: [...state.brouhaha.history, historyEntry],
    },
  };

  const events: TacticalEvent[] = [
    requestedEvent,
    {
      type: "brouhaha-level-changed",
      requestId: request.id,
      previousLevel: state.brouhaha.level,
      level: nextLevel,
      requestedDelta: request.delta,
      appliedDelta,
      reason: request.reason,
    },
    ...effects.map<TacticalEvent>((effect, index) => ({
      type: "brouhaha-effect-resolved",
      requestId: request.id,
      resolutionId: historyEntry.id,
      effectId: effect.id,
      effectName: effect.name,
      effectDescription: effect.description,
      effectIndex: index,
      effectCount: effects.length,
      level: nextLevel,
    })),
  ];

  return { state: nextState, events, effects, rejection: null };
}

export function clampBrouhahaLevel(level: number): number {
  return Math.min(BROUHAHA_MAX_LEVEL, Math.max(BROUHAHA_MIN_LEVEL, level));
}

export function eligibleEffects(
  definitions: readonly BrouhahaEffectDefinition[],
  level: number,
  dungeonId: string,
): BrouhahaEffectDefinition[] {
  return [...definitions]
    .filter(
      (effect) =>
        effect.minLevel <= level &&
        effect.maxLevel >= level &&
        (effect.scope.type === "universal" ||
          effect.scope.dungeonId === dungeonId),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function selectEffects(
  eligible: readonly BrouhahaEffectDefinition[],
  count: 1 | 2,
  sequence: number,
): BrouhahaEffectDefinition[] {
  if (eligible.length < count)
    throw new Error("Catalogue de Brouhaha insuffisant pour cette résolution.");
  const start = Math.max(0, sequence - 1) % eligible.length;
  return Array.from(
    { length: count },
    (_, index) => eligible[(start + index) % eligible.length]!,
  );
}

function reject(
  state: RoomState,
  request: BrouhahaRequest,
  reason: BrouhahaRejection["reason"],
  details: string[],
  requestedEvent: TacticalEvent,
): BrouhahaResult {
  const rejection: BrouhahaRejection = {
    requestId: request.id,
    reason,
    previousLevel: state.brouhaha.level,
    requestedDelta: request.delta,
    details,
  };
  return {
    state,
    effects: [],
    rejection,
    events: [
      requestedEvent,
      {
        type: "brouhaha-change-rejected",
        requestId: request.id,
        reason,
        previousLevel: state.brouhaha.level,
        requestedDelta: request.delta,
        details,
      },
    ],
  };
}
