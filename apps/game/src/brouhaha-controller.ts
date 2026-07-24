import {
  changeBrouhaha,
  type BrouhahaEffectDefinition,
  type BrouhahaReinforcementDefinition,
  type BrouhahaRequest,
  type BrouhahaResult,
  type CreatureDefinition,
  type RoomState,
  type TacticalEvent,
} from "@gargotte/engine";

export type BrouhahaControlId =
  "combat-engage" | "objet-casse" | "explosion" | "tour-calme";

export interface BrouhahaControlAction {
  id: BrouhahaControlId;
  label: string;
}

export const brouhahaControlActions: readonly BrouhahaControlAction[] = [
  { id: "combat-engage", label: "🔔 Combat engagé · +1" },
  { id: "objet-casse", label: "🪑 Objet cassé · +1" },
  { id: "explosion", label: "💥 Explosion · +2" },
  { id: "tour-calme", label: "🤫 Tour calme · −2" },
];

export function executeBrouhahaControl(
  room: RoomState,
  effectDefinitions: readonly BrouhahaEffectDefinition[],
  creatureDefinitions: readonly CreatureDefinition[],
  reinforcementDefinitions: readonly BrouhahaReinforcementDefinition[],
  dungeonId: string,
  controlId: BrouhahaControlId,
): BrouhahaResult {
  return changeBrouhaha(
    room,
    effectDefinitions,
    requestForControl(room, controlId),
    { dungeonId, creatureDefinitions, reinforcementDefinitions },
  );
}

export function describeBrouhahaEvent(event: TacticalEvent): string | null {
  switch (event.type) {
    case "brouhaha-change-requested":
      return `Brouhaha demandé: ${formatDelta(event.delta)} · ${event.reason}.`;
    case "brouhaha-level-changed":
      return `Brouhaha: ${event.previousLevel} → ${event.level} (${formatDelta(event.appliedDelta)}).`;
    case "brouhaha-effect-resolved":
      return `Effet ${event.effectIndex + 1}/${event.effectCount}: ${event.effectName} · ${event.effectDescription}`;
    case "brouhaha-change-rejected":
      return `Brouhaha inchangé (${event.reason})${event.details.length ? ` · ${event.details.join(" · ")}` : ""}.`;
    case "reinforcement-triggered":
      return `Seuil ${event.threshold} franchi : renfort ${event.reinforcementDefinitionId}, activation ${event.activation}.`;
    case "reinforcement-resolved":
      return `Renfort ${event.reinforcementDefinitionId} ${reinforcementLabel(event.result)} · ${event.details.join(" · ")}`;
    default:
      return null;
  }
}

function requestForControl(
  room: RoomState,
  controlId: BrouhahaControlId,
): BrouhahaRequest {
  const sequence = room.brouhaha.nextResolutionSequence;
  const id = `brouhaha-${controlId}-${sequence}`;
  switch (controlId) {
    case "combat-engage":
      return {
        id,
        delta: 1,
        source: { type: "combat", id: controlId },
        reason: "Un combat est engagé",
      };
    case "objet-casse":
      return {
        id,
        delta: 1,
        source: { type: "object", id: controlId },
        reason: "Un objet est cassé",
      };
    case "explosion":
      return {
        id,
        delta: 2,
        source: { type: "explosion", id: controlId },
        reason: "Une explosion secoue la salle",
      };
    case "tour-calme":
      return {
        id,
        delta: -2,
        source: { type: "calm-turn", id: controlId },
        reason: "Les héros passent un tour calme",
      };
  }
}

function reinforcementLabel(
  result: "succeeded" | "partial" | "rejected",
): string {
  if (result === "succeeded") return "réussi";
  if (result === "partial") return "partiel";
  return "refusé";
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}
