import { z } from "zod";
import { brouhahaReinforcementDefinitionSchema } from "./brouhaha-reinforcements";
import { chainReactionDefinitionSchema } from "./chain-reactions";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const gridPositionSchema = z
  .object({
    column: z.number().int().nonnegative(),
    row: z.number().int().nonnegative(),
  })
  .strict();

const actorSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    position: gridPositionSchema,
    hp: z.number().int().positive(),
    maxHp: z.number().int().positive(),
    atk: z.number().int().nonnegative(),
    def: z.number().int().nonnegative(),
    range: z.number().int().positive(),
  })
  .strict()
  .refine((actor) => actor.hp <= actor.maxHp, {
    message: "hp doit être inférieur ou égal à maxHp",
  });

const initialCreaturePlacementSchema = z
  .object({
    id: slugSchema,
    creatureId: slugSchema,
    position: gridPositionSchema,
  })
  .strict();

const initialInteractablePlacementSchema = z
  .object({
    id: slugSchema,
    interactableId: slugSchema,
    position: gridPositionSchema,
    stateId: slugSchema,
  })
  .strict();

const spawnPointSchema = z
  .object({
    id: slugSchema,
    position: gridPositionSchema,
    tags: z.array(slugSchema),
    enabled: z.boolean(),
  })
  .strict();

const spawnRequestDefinitionSchema = z
  .object({
    id: slugSchema,
    label: z.string().min(1),
    creatureId: slugSchema,
    quantity: z.number().int().positive(),
    candidateSpawnPointIds: z.array(slugSchema).min(1),
    failureMode: z.enum(["all-or-nothing", "partial"]),
  })
  .strict();

const commonRoomFields = {
  id: slugSchema,
  name: z.string().min(1),
  grid: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .strict(),
  obstacles: z.array(gridPositionSchema),
  interactables: z.array(initialInteractablePlacementSchema),
  chainReactions: z.array(chainReactionDefinitionSchema),
  spawnPoints: z.array(spawnPointSchema),
  scriptedSpawns: z.array(spawnRequestDefinitionSchema),
  brouhahaReinforcements: z.array(brouhahaReinforcementDefinitionSchema),
  heroes: z.array(actorSchema).length(4),
  notes: z.string().min(1),
};

export const tacticalRoomSchema = z
  .object({
    schemaVersion: z.literal(6),
    ...commonRoomFields,
    initialSpawns: z.array(spawnRequestDefinitionSchema).min(1),
  })
  .strict()
  .superRefine(validateRoom);

const legacyTacticalRoomSchema = z
  .object({
    schemaVersion: z.literal(5),
    ...commonRoomFields,
    enemies: z.array(initialCreaturePlacementSchema).min(1),
  })
  .strict()
  .superRefine(validateLegacyRoom);

function validateRoom(
  room: z.infer<typeof tacticalRoomSchema>,
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

function validateLegacyRoom(
  room: z.infer<typeof legacyTacticalRoomSchema>,
  context: z.RefinementCtx,
): void {
  validateCommonRoom(room, context, room.enemies);
}

function validateCommonRoom(
  room: z.infer<typeof tacticalRoomSchema> | z.infer<typeof legacyTacticalRoomSchema>,
  context: z.RefinementCtx,
  legacyEnemies: z.infer<typeof initialCreaturePlacementSchema>[] = [],
): void {
  const occupied = new Map<string, string>();
  const actorIds = new Set<string>();
  const interactableInstanceIds = new Set<string>();
  const spawnPointIds = new Set<string>();
  const spawnPointPositions = new Map<string, string>();
  const reactionIds = new Set<string>();
  const reinforcementIds = new Set<string>();
  const addBlockingPosition = (
    position: { column: number; row: number },
    label: string,
  ) => {
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

  for (const reaction of room.chainReactions) {
    if (reactionIds.has(reaction.id))
      context.addIssue({
        code: "custom",
        message: `réaction en chaîne dupliquée ${reaction.id}`,
      });
    reactionIds.add(reaction.id);
    if (!interactableInstanceIds.has(reaction.trigger.interactableInstanceId))
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
      if (target && !interactableInstanceIds.has(target))
        context.addIssue({
          code: "custom",
          message: `${reaction.id}: cible absente ${target}`,
        });
    }
  }

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
  position: { column: number; row: number },
  label: string,
  context: z.RefinementCtx,
): void {
  if (position.column >= room.grid.width || position.row >= room.grid.height)
    context.addIssue({ code: "custom", message: `${label} hors plateau` });
}

export type TacticalRoomDefinition = z.infer<typeof tacticalRoomSchema>;

export function parseTacticalRoom(value: unknown): TacticalRoomDefinition {
  const current = tacticalRoomSchema.safeParse(value);
  if (current.success) return current.data;

  const legacy = legacyTacticalRoomSchema.safeParse(value);
  if (!legacy.success) return tacticalRoomSchema.parse(value);
  const { enemies, ...room } = legacy.data;
  const migrated = {
    ...room,
    schemaVersion: 6 as const,
    spawnPoints: [
      ...room.spawnPoints,
      ...enemies.map((enemy) => ({
        id: `initial-${enemy.id}`,
        position: enemy.position,
        tags: ["initial"],
        enabled: true,
      })),
    ],
    initialSpawns: enemies.map((enemy) => ({
      id: `initial-${enemy.id}`,
      label: `Population initiale ${enemy.creatureId}`,
      creatureId: enemy.creatureId,
      quantity: 1,
      candidateSpawnPointIds: [`initial-${enemy.id}`],
      failureMode: "all-or-nothing" as const,
    })),
  };
  return tacticalRoomSchema.parse(migrated);
}
