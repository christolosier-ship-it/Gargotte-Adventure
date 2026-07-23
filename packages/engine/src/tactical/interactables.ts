import { changeBrouhaha, type BrouhahaResult } from "./brouhaha";
import type { TacticalEvent } from "./events";
import { manhattanDistance, occupantAt } from "./grid";
import type {
  BrouhahaEffectDefinition,
  InteractableDefinition,
  InteractableInteractionDefinition,
  InteractableInteractionRejection,
  InteractableInteractionRequest,
  InteractableInstance,
  RoomState,
} from "./types";

export interface InteractableContext {
  dungeonId: string;
}

export interface AvailableInteractableInteraction {
  interactableInstanceId: string;
  interactableId: string;
  objectName: string;
  interactionId: string;
  label: string;
}

export interface InteractableInteractionResult {
  state: RoomState;
  events: TacticalEvent[];
  interactable: InteractableInstance | null;
  interaction: InteractableInteractionDefinition | null;
  brouhaha: BrouhahaResult | null;
  rejection: InteractableInteractionRejection | null;
}

export function listAvailableInteractableInteractions(
  state: RoomState,
  definitions: readonly InteractableDefinition[],
  heroId: string,
): AvailableInteractableInteraction[] {
  if (state.phase !== "heroes-turn" || state.activeHeroId !== heroId) return [];
  const hero = state.heroes.find(
    (candidate) => candidate.id === heroId && candidate.alive,
  );
  if (!hero || hero.actionsRemaining <= 0) return [];
  const definitionsById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  return state.interactables.flatMap((instance) => {
    if (manhattanDistance(hero.position, instance.position) !== 1) return [];
    const definition = definitionsById.get(instance.interactableId);
    if (!definition) return [];
    return definition.interactions
      .filter((interaction) => interaction.fromStateId === instance.stateId)
      .filter((interaction) =>
        canTransitionToState(state, instance, definition, interaction),
      )
      .map((interaction) => ({
        interactableInstanceId: instance.id,
        interactableId: definition.id,
        objectName: instance.name,
        interactionId: interaction.id,
        label: interaction.label,
      }));
  });
}

export function interactWithObject(
  state: RoomState,
  definitions: readonly InteractableDefinition[],
  brouhahaEffects: readonly BrouhahaEffectDefinition[],
  request: InteractableInteractionRequest,
  context: InteractableContext,
): InteractableInteractionResult {
  const requestedEvent: TacticalEvent = {
    type: "interactable-interaction-requested",
    requestId: request.id,
    heroId: request.heroId,
    interactableInstanceId: request.interactableInstanceId,
    interactionId: request.interactionId,
  };
  const rejectRequest = (
    reason: InteractableInteractionRejection["reason"],
    details: string[],
  ) => reject(state, request, reason, details, requestedEvent);

  if (state.processedInteractableRequestIds.includes(request.id))
    return rejectRequest("duplicate-request", [
      "Cette demande d'interaction a déjà été appliquée.",
    ]);
  if (state.phase === "victory" || state.phase === "defeat")
    return rejectRequest("terminal-room", [
      "Aucun objet ne peut être utilisé dans une salle terminée.",
    ]);
  if (state.phase !== "heroes-turn")
    return rejectRequest("not-heroes-turn", [
      "Les objets ne peuvent être utilisés que pendant le tour des héros.",
    ]);

  const hero = state.heroes.find(
    (candidate) => candidate.id === request.heroId && candidate.alive,
  );
  if (!hero)
    return rejectRequest("hero-not-found", [
      `Héros absent ou vaincu : ${request.heroId}.`,
    ]);
  if (state.activeHeroId !== hero.id)
    return rejectRequest("not-active-hero", [
      "Seul le héros actif peut interagir avec le décor.",
    ]);
  if (hero.actionsRemaining <= 0)
    return rejectRequest("no-actions", [
      "Le héros actif n'a plus d'action disponible.",
    ]);

  const instance = state.interactables.find(
    (candidate) => candidate.id === request.interactableInstanceId,
  );
  if (!instance)
    return rejectRequest("interactable-not-found", [
      `Objet absent : ${request.interactableInstanceId}.`,
    ]);
  const definition = definitions.find(
    (candidate) => candidate.id === instance.interactableId,
  );
  if (!definition)
    return rejectRequest("definition-not-found", [
      `Définition absente : ${instance.interactableId}.`,
    ]);
  const interaction = definition.interactions.find(
    (candidate) => candidate.id === request.interactionId,
  );
  if (!interaction)
    return rejectRequest("interaction-not-found", [
      `Interaction absente : ${request.interactionId}.`,
    ]);
  if (interaction.fromStateId !== instance.stateId)
    return rejectRequest("invalid-state", [
      `${interaction.label} exige l'état ${interaction.fromStateId}, pas ${instance.stateId}.`,
    ]);
  if (manhattanDistance(hero.position, instance.position) !== 1)
    return rejectRequest("out-of-range", [
      "Le héros doit être sur une case orthogonalement adjacente.",
    ]);
  if (!canTransitionToState(state, instance, definition, interaction))
    return rejectRequest("destination-occupied", [
      "La case de l'objet est occupée et ne peut pas redevenir bloquante.",
    ]);

  const targetState = definition.states.find(
    (candidate) => candidate.id === interaction.toStateId,
  )!;
  const updatedInteractable: InteractableInstance = {
    ...instance,
    stateId: targetState.id,
    blocksMovement: targetState.blocksMovement,
    blocksLineOfSight: targetState.blocksLineOfSight,
  };
  const intermediateState: RoomState = {
    ...state,
    interactables: state.interactables.map((candidate) =>
      candidate.id === instance.id ? updatedInteractable : candidate,
    ),
    processedInteractableRequestIds: [
      ...state.processedInteractableRequestIds,
      request.id,
    ],
    nextInteractableInteractionSequence:
      state.nextInteractableInteractionSequence + 1,
    heroes: state.heroes.map((candidate) =>
      candidate.id === hero.id
        ? { ...candidate, actionsRemaining: candidate.actionsRemaining - 1 }
        : candidate,
    ),
  };
  const brouhahaRequestId =
    interaction.brouhahaDelta === 0 ? null : `${request.id}-brouhaha`;
  const objectEvents: TacticalEvent[] = [
    requestedEvent,
    {
      type: "interactable-state-changed",
      requestId: request.id,
      interactableInstanceId: instance.id,
      interactableId: instance.interactableId,
      kind: instance.kind,
      previousStateId: instance.stateId,
      stateId: targetState.id,
    },
    {
      type: "interactable-interaction-succeeded",
      requestId: request.id,
      heroId: hero.id,
      interactableInstanceId: instance.id,
      interactionId: interaction.id,
      actionCost: 1,
      brouhahaRequestId,
    },
  ];

  if (!brouhahaRequestId)
    return {
      state: intermediateState,
      events: objectEvents,
      interactable: updatedInteractable,
      interaction,
      brouhaha: null,
      rejection: null,
    };

  const brouhaha = changeBrouhaha(
    intermediateState,
    brouhahaEffects,
    {
      id: brouhahaRequestId,
      delta: interaction.brouhahaDelta,
      source: { type: "object", id: instance.id },
      reason: interaction.reason,
    },
    context,
  );
  return {
    state: brouhaha.state,
    events: [...objectEvents, ...brouhaha.events],
    interactable: updatedInteractable,
    interaction,
    brouhaha,
    rejection: null,
  };
}

function canTransitionToState(
  state: RoomState,
  instance: InteractableInstance,
  definition: InteractableDefinition,
  interaction: InteractableInteractionDefinition,
): boolean {
  const targetState = definition.states.find(
    (candidate) => candidate.id === interaction.toStateId,
  );
  if (!targetState) return false;
  return !targetState.blocksMovement || !occupantAt(state, instance.position);
}

function reject(
  state: RoomState,
  request: InteractableInteractionRequest,
  reason: InteractableInteractionRejection["reason"],
  details: string[],
  requestedEvent: TacticalEvent,
): InteractableInteractionResult {
  const rejection: InteractableInteractionRejection = {
    requestId: request.id,
    reason,
    details,
  };
  return {
    state,
    interactable: null,
    interaction: null,
    brouhaha: null,
    rejection,
    events: [
      requestedEvent,
      {
        type: "interactable-interaction-rejected",
        requestId: request.id,
        heroId: request.heroId,
        interactableInstanceId: request.interactableInstanceId,
        interactionId: request.interactionId,
        reason,
        details,
      },
    ],
  };
}
