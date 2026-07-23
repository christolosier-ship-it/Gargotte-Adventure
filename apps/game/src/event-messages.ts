import type {
  CreatureDefinition,
  DomainEvent,
  InteractableDefinition,
  TacticalEvent,
} from "@gargotte/engine";
import { describeBrouhahaEvent } from "./brouhaha-controller";
import { describeInteractableEvent } from "./interactable-controller";
import { describeSpawnEvent } from "./scripted-spawn-controller";

export function describeTacticalEvent(
  event: TacticalEvent,
  creatures: readonly CreatureDefinition[],
  interactables: readonly InteractableDefinition[],
): string {
  return (
    describeInteractableEvent(event, interactables) ??
    describeBrouhahaEvent(event) ??
    describeSpawnEvent(event, creatures) ??
    event.type
  );
}

export function appendTacticalEvents(
  append: (message: string) => void,
  events: readonly TacticalEvent[],
  creatures: readonly CreatureDefinition[],
  interactables: readonly InteractableDefinition[],
): void {
  events.forEach((event) =>
    append(describeTacticalEvent(event, creatures, interactables)),
  );
}

export function describeDomainEvent(event: DomainEvent): string {
  return event.type === "expedition/started"
    ? "Les héros entrent dans la salle tactique."
    : event.type === "expedition/returned-to-menu"
      ? "Retour au menu."
      : "Le moteur de jeu est prêt.";
}
