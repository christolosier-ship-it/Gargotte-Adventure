import { changeBrouhaha } from "./brouhaha";
import type { TacticalEvent } from "./events";
import {
  isObstacle,
  isWithinBounds,
  manhattanDistance,
  occupantAt,
  samePosition,
} from "./grid";
import { withTerminalPhase } from "./room-state";
import type {
  ChainReactionActionDefinition,
  ChainReactionDefinition,
  ChainReactionHistoryEntry,
  ChainReactionResult,
  ChainReactionRuntimeTrigger,
  ChainReactionTriggerDefinition,
} from "./chain-reaction-types";
import type {
  BrouhahaEffectDefinition,
  InteractableDefinition,
  InteractableInstance,
  RoomState,
} from "./types";

export const MAX_CHAIN_REACTION_STEPS = 32;

export interface ChainReactionContext {
  dungeonId: string;
  rootRequestId: string;
}

interface ActionResolution {
  state: RoomState;
  events: TacticalEvent[];
  triggers: ChainReactionTriggerDefinition[];
  outcome: ChainReactionHistoryEntry["outcome"];
  targetId: string | null;
  details: string[];
}

export function resolveChainReactions(
  initialState: RoomState,
  interactableDefinitions: readonly InteractableDefinition[],
  brouhahaEffects: readonly BrouhahaEffectDefinition[],
  reactionDefinitions: readonly ChainReactionDefinition[],
  initialTriggers: readonly ChainReactionRuntimeTrigger[],
  context: ChainReactionContext,
): ChainReactionResult {
  let state = initialState;
  const events: TacticalEvent[] = [];
  const history: ChainReactionHistoryEntry[] = [];
  const queue = [...initialTriggers];
  const executed = new Set<string>();
  const orderedDefinitions = [...reactionDefinitions].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  let guarded = false;

  while (queue.length > 0) {
    const runtimeTrigger = queue.shift()!;
    const matching = orderedDefinitions.filter((definition) =>
      triggerMatches(definition.trigger, runtimeTrigger.trigger),
    );

    for (const definition of matching) {
      if (executed.has(definition.id)) {
        const recorded = recordGuard(
          state,
          history,
          context,
          definition,
          runtimeTrigger,
          "cycle-detected",
        );
        state = recorded.state;
        events.push(recorded.event);
        guarded = true;
        continue;
      }
      if (executed.size >= MAX_CHAIN_REACTION_STEPS) {
        const recorded = recordGuard(
          state,
          history,
          context,
          definition,
          runtimeTrigger,
          "max-steps",
        );
        state = recorded.state;
        events.push(recorded.event);
        guarded = true;
        return { state, events, history, guarded };
      }

      executed.add(definition.id);
      events.push({
        type: "chain-reaction-triggered",
        rootRequestId: context.rootRequestId,
        reactionDefinitionId: definition.id,
        triggerType: runtimeTrigger.trigger.type,
        sourceInstanceId: runtimeTrigger.trigger.interactableInstanceId,
        parentReactionId: runtimeTrigger.parentReactionId,
      });

      for (const [actionIndex, action] of definition.actions.entries()) {
        const reactionId = `reaction-${state.nextChainReactionSequence}`;
        const resolution = resolveAction(
          state,
          interactableDefinitions,
          brouhahaEffects,
          action,
          reactionId,
          context,
        );
        const entry: ChainReactionHistoryEntry = {
          id: reactionId,
          rootRequestId: context.rootRequestId,
          sequence: state.nextChainReactionSequence,
          reactionDefinitionId: definition.id,
          triggerType: runtimeTrigger.trigger.type,
          sourceInstanceId: runtimeTrigger.trigger.interactableInstanceId,
          parentReactionId: runtimeTrigger.parentReactionId,
          actionIndex,
          actionType: action.type,
          targetId: resolution.targetId,
          outcome: resolution.outcome,
          details: resolution.details,
        };
        state = {
          ...resolution.state,
          nextChainReactionSequence: state.nextChainReactionSequence + 1,
          chainReactionHistory: [
            ...resolution.state.chainReactionHistory,
            entry,
          ],
        };
        history.push(entry);
        events.push(...resolution.events);
        queue.push(
          ...resolution.triggers.map((trigger) => ({
            trigger,
            parentReactionId: reactionId,
          })),
        );
      }
    }
  }

  return { state, events, history, guarded };
}

function triggerMatches(
  expected: ChainReactionTriggerDefinition,
  actual: ChainReactionTriggerDefinition,
): boolean {
  if (
    expected.type !== actual.type ||
    expected.interactableInstanceId !== actual.interactableInstanceId
  )
    return false;
  if (expected.type === "state-entered" && actual.type === "state-entered")
    return expected.stateId === actual.stateId;
  if (expected.type === "moved" && actual.type === "moved")
    return !expected.position || samePosition(expected.position, actual.position ?? {
      column: -1,
      row: -1,
    });
  return false;
}

function resolveAction(
  state: RoomState,
  definitions: readonly InteractableDefinition[],
  brouhahaEffects: readonly BrouhahaEffectDefinition[],
  action: ChainReactionActionDefinition,
  reactionId: string,
  context: ChainReactionContext,
): ActionResolution {
  if (action.type === "transition")
    return resolveTransition(
      state,
      definitions,
      brouhahaEffects,
      action,
      reactionId,
      context,
    );
  if (action.type === "move") return resolveMove(state, action, reactionId);
  if (action.type === "damage") return resolveDamage(state, action, reactionId);
  return resolveBrouhaha(
    state,
    brouhahaEffects,
    action,
    reactionId,
    context,
  );
}

function resolveTransition(
  state: RoomState,
  definitions: readonly InteractableDefinition[],
  brouhahaEffects: readonly BrouhahaEffectDefinition[],
  action: Extract<ChainReactionActionDefinition, { type: "transition" }>,
  reactionId: string,
  context: ChainReactionContext,
): ActionResolution {
  const instance = state.interactables.find(
    (candidate) => candidate.id === action.targetInstanceId,
  );
  const definition = definitions.find(
    (candidate) => candidate.id === instance?.interactableId,
  );
  const interaction = definition?.interactions.find(
    (candidate) => candidate.id === action.interactionId,
  );
  const targetState = definition?.states.find(
    (candidate) => candidate.id === interaction?.toStateId,
  );
  if (!instance || !definition || !interaction || !targetState)
    return skipped(state, reactionId, action.type, action.targetInstanceId, [
      "Cible, définition, interaction ou état cible absent.",
    ]);
  if (interaction.movement)
    return skipped(state, reactionId, action.type, instance.id, [
      "Une poussée exige une direction de héros et ne peut pas être rejouée par propagation.",
    ]);
  if (interaction.fromStateId !== instance.stateId)
    return skipped(state, reactionId, action.type, instance.id, [
      `État attendu ${interaction.fromStateId}, état courant ${instance.stateId}.`,
    ]);
  if (targetState.blocksMovement && occupantAt(state, instance.position))
    return skipped(state, reactionId, action.type, instance.id, [
      "La transition rendrait la case bloquante sur un combattant.",
    ]);

  const updated: InteractableInstance = {
    ...instance,
    stateId: targetState.id,
    blocksMovement: targetState.blocksMovement,
    blocksLineOfSight: targetState.blocksLineOfSight,
  };
  let nextState: RoomState = {
    ...state,
    interactables: state.interactables.map((candidate) =>
      candidate.id === instance.id ? updated : candidate,
    ),
  };
  const events: TacticalEvent[] = [
    {
      type: "interactable-state-changed",
      requestId: reactionId,
      interactableInstanceId: instance.id,
      interactableId: instance.interactableId,
      kind: instance.kind,
      previousStateId: instance.stateId,
      stateId: targetState.id,
      cause: { type: "chain-reaction", id: reactionId },
    },
  ];
  if (interaction.brouhahaDelta !== 0) {
    const brouhaha = changeBrouhaha(
      nextState,
      brouhahaEffects,
      {
        id: `${reactionId}-brouhaha`,
        delta: interaction.brouhahaDelta,
        source: { type: "object", id: instance.id },
        reason: interaction.reason,
      },
      { dungeonId: context.dungeonId },
    );
    nextState = brouhaha.state;
    events.push(...brouhaha.events);
  }
  return {
    state: nextState,
    events,
    triggers: [
      {
        type: "state-entered",
        interactableInstanceId: instance.id,
        stateId: targetState.id,
      },
    ],
    outcome: "applied",
    targetId: instance.id,
    details: [`${instance.stateId} → ${targetState.id}`],
  };
}

function resolveMove(
  state: RoomState,
  action: Extract<ChainReactionActionDefinition, { type: "move" }>,
  reactionId: string,
): ActionResolution {
  const instance = state.interactables.find(
    (candidate) => candidate.id === action.targetInstanceId,
  );
  if (!instance)
    return skipped(state, reactionId, action.type, action.targetInstanceId, [
      "Objet cible absent.",
    ]);
  const destination = {
    column: instance.position.column + action.offset.column,
    row: instance.position.row + action.offset.row,
  };
  if (!canOccupy(state, destination, instance.id))
    return skipped(state, reactionId, action.type, instance.id, [
      "Destination hors plateau ou occupée.",
    ]);
  const nextState = {
    ...state,
    interactables: state.interactables.map((candidate) =>
      candidate.id === instance.id
        ? { ...candidate, position: destination }
        : candidate,
    ),
  };
  return {
    state: nextState,
    events: [
      {
        type: "interactable-moved",
        requestId: reactionId,
        interactableInstanceId: instance.id,
        from: instance.position,
        to: destination,
        cause: { type: "chain-reaction", id: reactionId },
      },
    ],
    triggers: [
      {
        type: "moved",
        interactableInstanceId: instance.id,
        position: destination,
      },
    ],
    outcome: "applied",
    targetId: instance.id,
    details: [
      `${instance.position.column},${instance.position.row} → ${destination.column},${destination.row}`,
    ],
  };
}

function resolveDamage(
  state: RoomState,
  action: Extract<ChainReactionActionDefinition, { type: "damage" }>,
  reactionId: string,
): ActionResolution {
  const center = state.interactables.find(
    (candidate) => candidate.id === action.centerInstanceId,
  );
  if (!center)
    return skipped(state, reactionId, action.type, action.centerInstanceId, [
      "Centre de dégâts absent.",
    ]);
  const targets = [...state.heroes, ...state.enemies]
    .filter(
      (combatant) =>
        combatant.alive &&
        manhattanDistance(combatant.position, center.position) <= action.radius,
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const hpById = new Map(
    targets.map((target) => [target.id, Math.max(0, target.hp - action.amount)]),
  );
  const update = <T extends RoomState["heroes"][number] | RoomState["enemies"][number]>(
    combatant: T,
  ): T => {
    const hp = hpById.get(combatant.id);
    if (hp === undefined) return combatant;
    return {
      ...combatant,
      hp,
      alive: hp > 0,
      blocksMovement: hp > 0 ? combatant.blocksMovement : false,
    };
  };
  const nextState = withTerminalPhase({
    ...state,
    heroes: state.heroes.map(update),
    enemies: state.enemies.map(update),
  });
  const events: TacticalEvent[] = targets.flatMap((target) => {
    const hp = hpById.get(target.id)!;
    return [
      {
        type: "chain-reaction-damage-applied" as const,
        reactionId,
        combatantId: target.id,
        damage: action.amount,
        remainingHp: hp,
        centerInstanceId: center.id,
      },
      ...(hp === 0
        ? [{ type: "combatant-defeated" as const, combatantId: target.id }]
        : []),
    ];
  });
  return {
    state: nextState,
    events,
    triggers: [],
    outcome: "applied",
    targetId: center.id,
    details: [`${targets.length} combattant(s) touché(s).`],
  };
}

function resolveBrouhaha(
  state: RoomState,
  effects: readonly BrouhahaEffectDefinition[],
  action: Extract<ChainReactionActionDefinition, { type: "brouhaha" }>,
  reactionId: string,
  context: ChainReactionContext,
): ActionResolution {
  const result = changeBrouhaha(
    state,
    effects,
    {
      id: `${reactionId}-brouhaha`,
      delta: action.delta,
      source: { type: "object", id: reactionId },
      reason: action.reason,
    },
    { dungeonId: context.dungeonId },
  );
  return {
    state: result.state,
    events: result.events,
    triggers: [],
    outcome: result.rejection ? "skipped" : "applied",
    targetId: null,
    details: result.rejection?.details ?? [action.reason],
  };
}

function skipped(
  state: RoomState,
  reactionId: string,
  actionType: ChainReactionActionDefinition["type"],
  targetId: string | null,
  details: string[],
): ActionResolution {
  return {
    state,
    events: [
      {
        type: "chain-reaction-action-skipped",
        reactionId,
        actionType,
        targetId,
        details,
      },
    ],
    triggers: [],
    outcome: "skipped",
    targetId,
    details,
  };
}

function canOccupy(
  state: RoomState,
  position: { column: number; row: number },
  movingId: string,
): boolean {
  return (
    isWithinBounds(position, state.width, state.height) &&
    !isObstacle(position, state.obstacles) &&
    !occupantAt(state, position) &&
    !state.interactables.some(
      (candidate) =>
        candidate.id !== movingId && samePosition(candidate.position, position),
    )
  );
}

function recordGuard(
  state: RoomState,
  history: ChainReactionHistoryEntry[],
  context: ChainReactionContext,
  definition: ChainReactionDefinition,
  runtimeTrigger: ChainReactionRuntimeTrigger,
  reason: "cycle-detected" | "max-steps",
): { state: RoomState; event: TacticalEvent } {
  const sequence = state.nextChainReactionSequence;
  const id = `reaction-${sequence}`;
  const entry: ChainReactionHistoryEntry = {
    id,
    rootRequestId: context.rootRequestId,
    sequence,
    reactionDefinitionId: definition.id,
    triggerType: runtimeTrigger.trigger.type,
    sourceInstanceId: runtimeTrigger.trigger.interactableInstanceId,
    parentReactionId: runtimeTrigger.parentReactionId,
    actionIndex: 0,
    actionType: "guard",
    targetId: null,
    outcome: "guarded",
    details: [reason],
  };
  history.push(entry);
  return {
    state: {
      ...state,
      nextChainReactionSequence: sequence + 1,
      chainReactionHistory: [...state.chainReactionHistory, entry],
    },
    event: {
      type: "chain-reaction-guarded",
      reactionId: id,
      rootRequestId: context.rootRequestId,
      reactionDefinitionId: definition.id,
      reason,
    },
  };
}
