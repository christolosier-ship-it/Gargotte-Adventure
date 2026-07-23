import type { TacticalRoomDefinition } from "@gargotte/content-schema";
import {
  spawnCreatures,
  type CreatureDefinition,
  type RoomState,
  type SpawnResult,
  type TacticalEvent,
} from "@gargotte/engine";
import type { ScriptedSpawnAction } from "./tactical-actions";

type ScriptedSpawnDefinition = TacticalRoomDefinition["scriptedSpawns"][number];

export function availableScriptedSpawns(
  room: RoomState,
  scriptedSpawns: readonly ScriptedSpawnDefinition[],
): ScriptedSpawnAction[] {
  const pointIds = new Set(room.spawnPoints.map((point) => point.id));
  return scriptedSpawns
    .filter(
      (spawn) =>
        !room.processedSpawnRequestIds.includes(spawn.id) &&
        spawn.candidateSpawnPointIds.some((id) => pointIds.has(id)),
    )
    .map(({ id, label }) => ({ id, label }));
}

export function executeScriptedSpawn(
  room: RoomState,
  creatureDefinitions: readonly CreatureDefinition[],
  scripted: ScriptedSpawnDefinition,
): SpawnResult {
  return spawnCreatures(room, creatureDefinitions, {
    id: scripted.id,
    source: { type: "scenario", id: scripted.id },
    creatureId: scripted.creatureId,
    quantity: scripted.quantity,
    candidateSpawnPointIds: scripted.candidateSpawnPointIds,
    failureMode: scripted.failureMode,
  });
}

export function describeSpawnEvent(
  event: TacticalEvent,
  creatureDefinitions: readonly CreatureDefinition[],
): string | null {
  const creatureName =
    creatureDefinitions.find(
      (definition) => definition.id === eventCreatureId(event),
    )?.name ?? eventCreatureId(event);

  switch (event.type) {
    case "spawn-requested":
      return `Demande d'apparition: ${event.quantity} × ${creatureName}.`;
    case "creature-instantiated":
      return `${creatureName} apparaît en colonne ${event.position.column + 1}, ligne ${event.position.row + 1} sous l'identifiant ${event.instanceId}.`;
    case "spawn-succeeded":
      return `Apparition réussie: ${event.createdInstanceIds.length}/${event.requested} instance(s).`;
    case "spawn-rejected":
      return `Apparition refusée (${event.reason}): ${event.available}/${event.requested} point(s) valide(s)${event.details.length ? ` · ${event.details.join(" · ")}` : ""}.`;
    default:
      return null;
  }
}

function eventCreatureId(event: TacticalEvent): string {
  return "creatureId" in event ? event.creatureId : "créature";
}
