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
    describeCoreTacticalEvent(event)
  );
}

export function describeDomainEvent(event: DomainEvent): string {
  return event.type === "expedition/started"
    ? "Les héros entrent dans la salle tactique."
    : event.type === "expedition/returned-to-menu"
      ? "Retour au menu."
      : "Le moteur de jeu est prêt.";
}

function describeCoreTacticalEvent(event: TacticalEvent): string {
  switch (event.type) {
    case "hero-selected":
      return `${humanize(event.heroId)} entre en action.`;
    case "combatant-moved":
      return `${humanize(event.combatantId)} se déplace en ${formatPosition(event.to)}.`;
    case "combatant-attacked":
      return `${humanize(event.attackerId)} frappe ${humanize(event.targetId)} : ${event.damage} dégâts, ${event.remainingHp} PV restants.`;
    case "combatant-defeated":
      return `${humanize(event.combatantId)} est vaincu.`;
    case "activation-ended":
      return `Activation de ${humanize(event.heroId)} terminée.`;
    case "enemy-decision":
      return `${humanize(event.enemyId)} : ${event.explanation.reason}.`;
    case "phase-changed":
      return event.phase === "victory"
        ? "Victoire : la salle est nettoyée."
        : event.phase === "defeat"
          ? "Défaite : les héros sont hors combat."
          : `Phase ${humanize(event.phase)}, tour ${event.turn}.`;
    case "chain-reaction-triggered":
      return `Réaction ${humanize(event.reactionDefinitionId)} déclenchée par ${humanize(event.sourceInstanceId)}.`;
    case "chain-reaction-damage-applied":
      return `${humanize(event.combatantId)} subit ${event.damage} dégâts de réaction, ${event.remainingHp} PV restants.`;
    case "chain-reaction-action-skipped":
      return `Réaction ignorée (${event.actionType})${event.details.length ? ` : ${event.details.join(" · ")}` : "."}`;
    case "chain-reaction-guarded":
      return event.reason === "cycle-detected"
        ? "Réaction interrompue : cycle détecté."
        : "Réaction interrompue : limite de propagation atteinte.";
    default:
      return humanize(event.type);
  }
}

function formatPosition(position: { column: number; row: number }): string {
  return `colonne ${position.column + 1}, ligne ${position.row + 1}`;
}

function humanize(value: string): string {
  const text = value.replaceAll("-", " ").replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
