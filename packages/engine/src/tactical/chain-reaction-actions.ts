import { changeBrouhaha } from "./brouhaha";
import { resolveChainReactionDamage } from "./chain-reaction-damage";
import type {
  ChainReactionActionDefinition,
  ChainReactionActionResolution,
} from "./chain-reaction-types";
import {
  isObstacle,
  isWithinBounds,
  occupantAt,
  samePosition,
} from "./grid";
import type {
  BrouhahaEffectDefinition,
  InteractableDefinition,
  InteractableInstance,
  RoomState,
} from "./types";

export function resolveChainReactionAction(
  state: RoomState,
  definitions: readonly InteractableDefinition[],
  brouhahaEffects: readonly BrouhahaEffectDefinition[],
  action: ChainReactionActionDefinition,
  reactionId: string,
  dungeonId: string,
): ChainReactionActionResolution {
  if (action.type === "transition")
    return resolveTransition(
      state,
      definitions,
      brouhahaEffects,
      action,
      reactionId,
      dungeonId,
    );
  if (action.type === "move") return resolveMove(state, action, reactionId);
  if (action.type === "damage")
    return resolveChainReactionDamage(state, action, reactionId);
  return resolveBrouhaha(
    state,
    brouhahaEffects,
    action,
    reactionId,
    dungeonId,
  );
}

function resolveTransition(
  state: RoomState,
  definitions: readonly InteractableDefinition[],
  brouhahaEffects: readonly BrouhahaEffectDefinition[],
  action: Extract<ChainReactionActionDefinition, { type: "transition" }>,
  reactionId: string,
  dungeonId: string,
): ChainReactionActionResolution {
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
      "Une poussée exige la direction d'un héros et ne peut pas être rejouée par propagation.",
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
  const events: ChainReactionActionResolution["events"] = [
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
      { dungeonId },
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
): ChainReactionActionResolution {
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

function resolveBrouhaha(
  state: RoomState,
  effects: readonly BrouhahaEffectDefinition[],
  action: Extract<ChainReactionActionDefinition, { type: "brouhaha" }>,
  reactionId: string,
  dungeonId: string,
): ChainReactionActionResolution {
  const result = changeBrouhaha(
    state,
    effects,
    {
      id: `${reactionId}-brouhaha`,
      delta: action.delta,
      source: { type: "object", id: reactionId },
      reason: action.reason,
    },
    { dungeonId },
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
): ChainReactionActionResolution {
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
