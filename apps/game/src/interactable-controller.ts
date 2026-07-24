import {
  interactWithObject,
  listAvailableInteractableInteractions,
  type BrouhahaEffectDefinition,
  type BrouhahaReinforcementDefinition,
  type ChainReactionDefinition,
  type CreatureDefinition,
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
  chainReactions: readonly ChainReactionDefinition[],
  creatureDefinitions: readonly CreatureDefinition[],
  reinforcementDefinitions: readonly BrouhahaReinforcementDefinition[],
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
    { dungeonId, creatureDefinitions, reinforcementDefinitions },
    chainReactions,
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
    const cause =
      event.cause.type === "chain-reaction"
        ? ` Réaction ${event.cause.id}.`
        : "";
    return `${name} : ${event.previousStateId} → ${event.stateId}.${cause}`;
  }
  if (event.type === "interactable-moved")
    return `Objet ${event.interactableInstanceId} déplacé de ${event.from.column},${event.from.row} vers ${event.to.column},${event.to.row}.`;
  if (event.type === "interactable-interaction-succeeded")
    return `Interaction ${event.interactionId} réussie, 1 action consommée.`;
  if (event.type === "interactable-interaction-rejected")
    return `Interaction refusée : ${event.details.join(" ")}`;
  if (event.type === "chain-reaction-triggered")
    return `Réaction ${event.reactionDefinitionId} déclenchée par ${event.sourceInstanceId}.`;
  if (event.type === "chain-reaction-damage-applied")
    return `${event.combatantId} subit ${event.damage} dégâts de réaction, ${event.remainingHp} PV restants.`;
  if (event.type === "chain-reaction-action-skipped")
    return `Réaction ${event.reactionId} ignorée : ${event.details.join(" ")}`;
  if (event.type === "chain-reaction-guarded")
    return `Chaîne interrompue par sécurité : ${event.reason}.`;
  return null;
}
