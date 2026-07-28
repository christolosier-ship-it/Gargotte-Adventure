import { z } from "zod";
import type { BrouhahaReinforcementDefinition } from "./brouhaha-reinforcements";
import type { ChainReactionDefinition } from "./chain-reactions";

interface Position {
  column: number;
  row: number;
}

interface ActorLike {
  id: string;
  position: Position;
}

interface InteractablePlacementLike {
  id: string;
  interactableId: string;
  position: Position;
  stateId: string;
}

interface SpawnPointLike {
  id: string;
  position: Position;
}

interface SpawnRequestLike {
  id: string;
  candidateSpawnPointIds: string[];
}

interface RoomLike {
  grid: { width: number; height: number };
  obstacles: Position[];
  heroes: ActorLike[];
  interactables: InteractablePlacementLike[];
  chainReactions: ChainReactionDefinition[];
  spawnPoints: SpawnPointLike[];
  scriptedSpawns: SpawnRequestLike[];
  brouhahaReinforcements: BrouhahaReinforcementDefinition[];
}

export function validateCurrentRoom(
  room: RoomLike & { initialSpawns: SpawnRequestLike[] },
  context: z.RefinementCtx,
): void {
  validateCommonRoom(room, context);
  const spawnPointIds = new Set(room.spawnPoints.map((point) => point.id));
  const requestIds = new Set<string>();
  for (const spawn of [...room.initialSpawns, ...room.scriptedSpawns]) {
    if (requestIds.has(spawn.id))
      context.addIssue({
        code: "custom",
        message: `demande de spawn dupliquée ${spawn.id}`,
      });
    requestIds.add(spawn.id);
    validateCandidatePoints(
      spawn.id,
      spawn.candidateSpawnPointIds,
      spawnPointIds,
      context,
    );
  }
}

export function validateLegacyRoom(
  room: RoomLike & { enemies: ActorLike[] },
  context: z.RefinementCtx,
): void {
  validateCommonRoom(room, context, room.enemies);
}

function validateCommonRoom(
  room: RoomLike,
  context: z.RefinementCtx,
  legacyEnemies: ActorLike[] = [],
): void {
  const occupied = new Map<string, string>();
  const actorIds = new Set<string>();
  const interactableInstanceIds = new Set<string>();
  const spawnPointIds = new Set<string>();
  const spawnPointPositions = new Map<string, string>();
  const reactionIds = new Set<string>();
  const reinforcementIds = new Set<string>();
  const addBlockingPosition = (position: Position, label: string) => {
    validatePosition(room, position, label, context);
    const key = `${position.column},${position.row}`;
    const other = occupied.get(key);
    if (other)
      context.addIssue({
        code: "custom",
        message: `position dupliquée ${label} avec ${other}`,
      });
    else occupied.set(key, label);
  };

  for (const [index, obstacle] of room.obstacles.entries())
    addBlockingPosition(obstacle, `obstacle ${index + 1}`);

  for (const actor of [...room.heroes, ...legacyEnemies]) {
    if (actorIds.has(actor.id))
      context.addIssue({
        code: "custom",
        message: `identifiant d’instance dupliqué ${actor.id}`,
      });
    actorIds.add(actor.id);
    addBlockingPosition(actor.position, actor.id);
  }

  for (const interactable of room.interactables) {
    if (
      actorIds.has(interactable.id) ||
      interactableInstanceIds.has(interactable.id)
    )
      context.addIssue({
        code: "custom",
        message: `identifiant d’instance dupliqué ${interactable.id}`,
      });
    interactableInstanceIds.add(interactable.id);
    addBlockingPosition(interactable.position, interactable.id);
  }

  validateReactions(room, interactableInstanceIds, reactionIds, context);

  for (const point of room.spawnPoints) {
    if (spawnPointIds.has(point.id))
      context.addIssue({
        code: "custom",
        message: `point de spawn dupliqué ${point.id}`,
      });
    spawnPointIds.add(point.id);
    validatePosition(room, point.position, point.id, context);
    const positionKey = `${point.position.column},${point.position.row}`;
    const otherPoint = spawnPointPositions.get(positionKey);
    if (otherPoint)
      context.addIssue({
        code: "custom",
        message: `${point.id} partage la position de ${otherPoint}`,
      });
    else spawnPointPositions.set(positionKey, point.id);
  }

  for (const scripted of room.scriptedSpawns)
    validateCandidatePoints(
      scripted.id,
      scripted.candidateSpawnPointIds,
      spawnPointIds,
      context,
    );

  for (const reinforcement of room.brouhahaReinforcements) {
    if (reinforcementIds.has(reinforcement.id))
      context.addIssue({
        code: "custom",
        message: `renfort de Brouhaha dupliqué ${reinforcement.id}`,
      });
    reinforcementIds.add(reinforcement.id);
    validateCandidatePoints(
      reinforcement.id,
      reinforcement.candidateSpawnPointIds,
      spawnPointIds,
      context,
    );
  }
}

function validateReactions(
  room: RoomLike,
  interactableIds: ReadonlySet<string>,
  reactionIds: Set<string>,
  context: z.RefinementCtx,
): void {
  for (const reaction of room.chainReactions) {
    if (reactionIds.has(reaction.id))
      context.addIssue({
        code: "custom",
        message: `réaction en chaîne dupliquée ${reaction.id}`,
      });
    reactionIds.add(reaction.id);
    if (!interactableIds.has(reaction.trigger.interactableInstanceId))
      context.addIssue({
        code: "custom",
        message: `${reaction.id}: déclencheur absent ${reaction.trigger.interactableInstanceId}`,
      });
    if (reaction.trigger.type === "moved" && reaction.trigger.position)
      validatePosition(room, reaction.trigger.position, reaction.id, context);
    for (const action of reaction.actions) {
      const target =
        action.type === "damage"
          ? action.centerInstanceId
          : action.type === "brouhaha"
            ? null
            : action.targetInstanceId;
      if (target && !interactableIds.has(target))
        context.addIssue({
          code: "custom",
          message: `${reaction.id}: cible absente ${target}`,
        });
    }
  }
}

function validateCandidatePoints(
  id: string,
  candidateIds: string[],
  spawnPointIds: ReadonlySet<string>,
  context: z.RefinementCtx,
): void {
  if (new Set(candidateIds).size !== candidateIds.length)
    context.addIssue({
      code: "custom",
      message: `${id} contient des points candidats dupliqués`,
    });
  for (const pointId of candidateIds)
    if (!spawnPointIds.has(pointId))
      context.addIssue({
        code: "custom",
        message: `${id} référence un point absent: ${pointId}`,
      });
}

function validatePosition(
  room: { grid: { width: number; height: number } },
  position: Position,
  label: string,
  context: z.RefinementCtx,
): void {
  if (position.column >= room.grid.width || position.row >= room.grid.height)
    context.addIssue({ code: "custom", message: `${label} hors plateau` });
}
