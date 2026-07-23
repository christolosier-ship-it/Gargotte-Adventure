import {
  interactWithObject,
  listAvailableInteractableInteractions,
  type BrouhahaEffectDefinition,
  type InteractableDefinition,
  type InteractableInteractionResult,
  type RoomState,
  type TacticalEvent,
} from "@gargotte/engine";

export interface InteractableAction {
  interactableInstanceId: string;
  interactionId: string;
  label: string;
  objectName: string;
}

export function availableInteractableActions(
  state: RoomState,
  definitions: readonly InteractableDefinition[],
): InteractableAction[] {
  if (!state.activeHeroId) return [];
  return listAvailableInteractableInteractions(
    state,
    definitions,
    state.activeHeroId,
  ).map((action) => ({
    interactableInstanceId: action.interactableInstanceId,
    interactionId: action.interactionId,
    label: action.label,
    objectName: action.objectName,
  }));
}

export function executeInteractableAction(
  state: RoomState,
  definitions: readonly InteractableDefinition[],
  brouhahaEffects: readonly BrouhahaEffectDefinition[],
  dungeonId: string,
  interactableInstanceId: string,
  interactionId: string,
): InteractableInteractionResult {
  const heroId = state.activeHeroId ?? "hero-absent";
  return interactWithObject(
    state,
    definitions,
    brouhahaEffects,
    {
      id: `interaction-objet-${state.nextInteractableInteractionSequence}`,
      heroId,
      interactableInstanceId,
      interactionId,
    },
    { dungeonId },
  );
}

export function describeInteractableEvent(
  event: TacticalEvent,
  definitions: readonly InteractableDefinition[],
): string | null {
  if (event.type === "interactable-state-changed") {
    const name =
      definitions.find((definition) => definition.id === event.interactableId)
        ?.name ?? event.interactableInstanceId;
    return `${name} : ${event.previousStateId} → ${event.stateId}.`;
  }
  if (event.type === "interactable-interaction-succeeded")
    return `Interaction ${event.interactionId} réussie, 1 action consommée.`;
  if (event.type === "interactable-interaction-rejected")
    return `Interaction refusée : ${event.details.join(" ")}`;
  return null;
}
