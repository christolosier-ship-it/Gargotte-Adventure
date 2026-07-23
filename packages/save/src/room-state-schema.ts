import { z } from "zod";
import { HERO_ACTIONS } from "@gargotte/engine";
import { brouhahaStateSchema } from "./brouhaha-schema";
import { interactableInstanceSchema } from "./interactable-schema";

const idSchema = z.string().min(1);
const gridPositionSchema = z
  .object({
    column: z.number().int().nonnegative(),
    row: z.number().int().nonnegative(),
  })
  .strict();

const combatantShape = {
  id: idSchema,
  name: z.string().min(1),
  position: gridPositionSchema,
  hp: z.number().int().nonnegative(),
  maxHp: z.number().int().positive(),
  atk: z.number().int().nonnegative(),
  def: z.number().int().nonnegative(),
  range: z.number().int().positive(),
  alive: z.boolean(),
  blocksMovement: z.boolean(),
};

const heroSchema = z
  .object({
    ...combatantShape,
    kind: z.literal("hero"),
    actionsRemaining: z.number().int().min(0).max(HERO_ACTIONS),
    activationCompleted: z.boolean(),
  })
  .strict()
  .superRefine(validateCombatant);

const enemySchema = z
  .object({
    ...combatantShape,
    kind: z.literal("enemy"),
    creatureId: idSchema,
  })
  .strict()
  .superRefine(validateCombatant);

const legacyEnemySchema = z
  .object({
    ...combatantShape,
    kind: z.literal("enemy"),
  })
  .strict()
  .superRefine(validateCombatant);

const spawnPointSchema = z
  .object({
    id: idSchema,
    position: gridPositionSchema,
    tags: z.array(idSchema),
    enabled: z.boolean(),
  })
  .strict();

const chainReactionHistoryEntrySchema = z
  .object({
    id: idSchema,
    rootRequestId: idSchema,
    sequence: z.number().int().positive(),
    reactionDefinitionId: idSchema,
    triggerType: z.enum(["state-entered", "moved"]),
    sourceInstanceId: idSchema,
    parentReactionId: idSchema.nullable(),
    actionIndex: z.number().int().nonnegative(),
    actionType: z.enum([
      "transition",
      "move",
      "damage",
      "brouhaha",
      "guard",
    ]),
    targetId: idSchema.nullable(),
    outcome: z.enum(["applied", "skipped", "guarded"]),
    details: z.array(z.string()),
  })
  .strict();

function validateCombatant(
  combatant: {
    hp: number;
    maxHp: number;
    alive: boolean;
    blocksMovement: boolean;
  },
  context: z.RefinementCtx,
): void {
  if (combatant.hp > combatant.maxHp)
    context.addIssue({
      code: "custom",
      path: ["hp"],
      message: "hp doit être inférieur ou égal à maxHp",
    });
  if (combatant.alive !== combatant.hp > 0)
    context.addIssue({
      code: "custom",
      path: ["alive"],
      message: "alive doit correspondre aux points de vie",
    });
  if (!combatant.alive && combatant.blocksMovement)
    context.addIssue({
      code: "custom",
      path: ["blocksMovement"],
      message: "un combattant vaincu ne peut pas bloquer le déplacement",
    });
}

const sharedRoomShape = {
  scenarioId: idSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  obstacles: z.array(gridPositionSchema),
  heroes: z.array(heroSchema).min(1),
  activeHeroId: idSchema.nullable(),
  phase: z.enum(["heroes-turn", "enemy-turn", "victory", "defeat"]),
  turn: z.number().int().positive(),
};

const roomV4Shape = {
  ...sharedRoomShape,
  interactables: z.array(interactableInstanceSchema),
  processedInteractableRequestIds: z.array(idSchema),
  nextInteractableInteractionSequence: z.number().int().positive(),
  spawnPoints: z.array(spawnPointSchema),
  processedSpawnRequestIds: z.array(idSchema),
  nextEnemyInstanceSequence: z.number().int().positive(),
  brouhaha: brouhahaStateSchema,
  enemies: z.array(enemySchema).min(1),
};

export const roomStateSchema = z
  .object({
    version: z.literal(5),
    ...roomV4Shape,
    nextChainReactionSequence: z.number().int().positive(),
    chainReactionHistory: z.array(chainReactionHistoryEntrySchema),
  })
  .strict()
  .superRefine(validateRoomState);

export const legacyRoomStateV4Schema = z
  .object({
    version: z.literal(4),
    ...roomV4Shape,
  })
  .strict()
  .superRefine(validateRoomState);

export const legacyRoomStateV3Schema = z
  .object({
    version: z.literal(3),
    ...sharedRoomShape,
    spawnPoints: z.array(spawnPointSchema),
    processedSpawnRequestIds: z.array(idSchema),
    nextEnemyInstanceSequence: z.number().int().positive(),
    brouhaha: brouhahaStateSchema,
    enemies: z.array(enemySchema).min(1),
  })
  .strict()
  .superRefine(validateRoomState);

export const legacyRoomStateV2Schema = z
  .object({
    version: z.literal(2),
    ...sharedRoomShape,
    spawnPoints: z.array(spawnPointSchema),
    processedSpawnRequestIds: z.array(idSchema),
    nextEnemyInstanceSequence: z.number().int().positive(),
    enemies: z.array(enemySchema).min(1),
  })
  .strict()
  .superRefine(validateRoomState);

export const legacyRoomStateV1Schema = z
  .object({
    version: z.literal(1),
    ...sharedRoomShape,
    enemies: z.array(legacyEnemySchema).min(1),
  })
  .strict()
  .superRefine(validateRoomState);

function validateRoomState(
  room: {
    width: number;
    height: number;
    obstacles: { column: number; row: number }[];
    interactables?: z.infer<typeof interactableInstanceSchema>[];
    heroes: z.infer<typeof heroSchema>[];
    enemies: z.infer<typeof legacyEnemySchema>[];
    activeHeroId: string | null;
    spawnPoints?: z.infer<typeof spawnPointSchema>[];
    processedSpawnRequestIds?: string[];
    processedInteractableRequestIds?: string[];
    nextChainReactionSequence?: number;
    chainReactionHistory?: z.infer<typeof chainReactionHistoryEntrySchema>[];
  },
  context: z.RefinementCtx,
): void {
  const ids = new Set<string>();
  const occupied = new Map<string, string>();
  const positionKey = (position: { column: number; row: number }) =>
    `${position.column},${position.row}`;
  const validatePosition = (
    position: { column: number; row: number },
    label: string,
    blocks = true,
  ) => {
    if (position.column >= room.width || position.row >= room.height)
      context.addIssue({ code: "custom", message: `${label} hors plateau` });
    if (!blocks) return;
    const key = positionKey(position);
    const previous = occupied.get(key);
    if (previous)
      context.addIssue({
        code: "custom",
        message: `${label} partage la position de ${previous}`,
      });
    else occupied.set(key, label);
  };

  for (const [index, obstacle] of room.obstacles.entries())
    validatePosition(obstacle, `obstacle ${index + 1}`);
  for (const combatant of [...room.heroes, ...room.enemies]) {
    validateUniqueId(combatant.id, ids, context);
    validatePosition(
      combatant.position,
      combatant.id,
      combatant.alive && combatant.blocksMovement,
    );
  }
  for (const interactable of room.interactables ?? []) {
    validateUniqueId(interactable.id, ids, context);
    validatePosition(
      interactable.position,
      interactable.id,
      interactable.blocksMovement,
    );
  }

  const spawnPointIds = new Set<string>();
  for (const point of room.spawnPoints ?? []) {
    if (spawnPointIds.has(point.id))
      context.addIssue({
        code: "custom",
        message: `point de spawn dupliqué ${point.id}`,
      });
    spawnPointIds.add(point.id);
    validatePosition(point.position, point.id, false);
  }

  validateUniqueRequests(
    room.processedSpawnRequestIds ?? [],
    "processedSpawnRequestIds",
    "les requêtes de spawn traitées doivent être uniques",
    context,
  );
  validateUniqueRequests(
    room.processedInteractableRequestIds ?? [],
    "processedInteractableRequestIds",
    "les requêtes d'interaction traitées doivent être uniques",
    context,
  );
  validateChainHistory(room, context);

  if (
    room.activeHeroId &&
    !room.heroes.some((hero) => hero.id === room.activeHeroId && hero.alive)
  )
    context.addIssue({
      code: "custom",
      path: ["activeHeroId"],
      message: "le héros actif doit exister et être vivant",
    });
}

function validateChainHistory(
  room: {
    nextChainReactionSequence?: number;
    chainReactionHistory?: z.infer<typeof chainReactionHistoryEntrySchema>[];
  },
  context: z.RefinementCtx,
): void {
  const history = room.chainReactionHistory ?? [];
  const ids = new Set(history.map((entry) => entry.id));
  const sequences = new Set(history.map((entry) => entry.sequence));
  if (ids.size !== history.length || sequences.size !== history.length)
    context.addIssue({
      code: "custom",
      path: ["chainReactionHistory"],
      message:
        "l'historique des réactions doit avoir des identifiants et séquences uniques",
    });
  const maximum = Math.max(0, ...history.map((entry) => entry.sequence));
  if (
    room.nextChainReactionSequence !== undefined &&
    room.nextChainReactionSequence <= maximum
  )
    context.addIssue({
      code: "custom",
      path: ["nextChainReactionSequence"],
      message: "la prochaine séquence doit suivre l'historique",
    });
}

function validateUniqueId(
  id: string,
  ids: Set<string>,
  context: z.RefinementCtx,
): void {
  if (ids.has(id))
    context.addIssue({ code: "custom", message: `identifiant dupliqué ${id}` });
  ids.add(id);
}

function validateUniqueRequests(
  ids: string[],
  path: string,
  message: string,
  context: z.RefinementCtx,
): void {
  if (new Set(ids).size !== ids.length)
    context.addIssue({ code: "custom", path: [path], message });
}
