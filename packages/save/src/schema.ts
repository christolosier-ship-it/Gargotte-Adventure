import { z } from "zod";
import { HERO_ACTIONS, type GameState, type RoomState } from "@gargotte/engine";

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

export const gameStateSchema = z
  .object({
    version: z.literal(1),
    phase: z.enum(["boot", "menu", "expedition"]),
    seed: z.number().int().nonnegative(),
    expeditionNumber: z.number().int().nonnegative(),
    lastEventId: z.string().min(1).nullable(),
  })
  .strict();

const currentRoomShape = {
  version: z.literal(2),
  scenarioId: idSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  obstacles: z.array(gridPositionSchema),
  spawnPoints: z.array(spawnPointSchema),
  processedSpawnRequestIds: z.array(idSchema),
  nextEnemyInstanceSequence: z.number().int().positive(),
  heroes: z.array(heroSchema).min(1),
  enemies: z.array(enemySchema).min(1),
  activeHeroId: idSchema.nullable(),
  phase: z.enum(["heroes-turn", "enemy-turn", "victory", "defeat"]),
  turn: z.number().int().positive(),
};

export const roomStateSchema = z
  .object(currentRoomShape)
  .strict()
  .superRefine(validateRoomState);

const legacyRoomStateSchema = z
  .object({
    version: z.literal(1),
    scenarioId: idSchema,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    obstacles: z.array(gridPositionSchema),
    heroes: z.array(heroSchema).min(1),
    enemies: z.array(legacyEnemySchema).min(1),
    activeHeroId: idSchema.nullable(),
    phase: z.enum(["heroes-turn", "enemy-turn", "victory", "defeat"]),
    turn: z.number().int().positive(),
  })
  .strict()
  .superRefine(validateRoomState);

function validateRoomState(
  room: {
    width: number;
    height: number;
    obstacles: { column: number; row: number }[];
    heroes: z.infer<typeof heroSchema>[];
    enemies: z.infer<typeof legacyEnemySchema>[];
    activeHeroId: string | null;
    spawnPoints?: z.infer<typeof spawnPointSchema>[];
    processedSpawnRequestIds?: string[];
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
      context.addIssue({
        code: "custom",
        message: `${label} hors plateau`,
      });
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
    if (ids.has(combatant.id))
      context.addIssue({
        code: "custom",
        message: `identifiant dupliqué ${combatant.id}`,
      });
    ids.add(combatant.id);
    validatePosition(
      combatant.position,
      combatant.id,
      combatant.alive && combatant.blocksMovement,
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

  if (
    new Set(room.processedSpawnRequestIds ?? []).size !==
    (room.processedSpawnRequestIds ?? []).length
  )
    context.addIssue({
      code: "custom",
      path: ["processedSpawnRequestIds"],
      message: "les requêtes de spawn traitées doivent être uniques",
    });

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

export const savedRoomPayloadSchema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(2),
    room: roomStateSchema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
  })
  .strict()
  .superRefine(validateSelectedHeroes);

const legacySavedRoomPayloadSchema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(1),
    room: legacyRoomStateSchema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
  })
  .strict()
  .superRefine(validateSelectedHeroes);

function validateSelectedHeroes(
  payload: {
    room: { heroes: { id: string }[] };
    selectedHeroIds: string[];
  },
  context: z.RefinementCtx,
): void {
  const unique = new Set(payload.selectedHeroIds);
  if (unique.size !== payload.selectedHeroIds.length)
    context.addIssue({
      code: "custom",
      path: ["selectedHeroIds"],
      message: "les héros sélectionnés doivent être uniques",
    });
  const heroIds = new Set(payload.room.heroes.map((hero) => hero.id));
  for (const id of payload.selectedHeroIds)
    if (!heroIds.has(id))
      context.addIssue({
        code: "custom",
        path: ["selectedHeroIds"],
        message: `héros sélectionné absent de la salle: ${id}`,
      });
}

export function parseSavedGameState(value: unknown): GameState | null {
  const parsed = gameStateSchema.safeParse(value);
  return parsed.success ? (parsed.data as GameState) : null;
}

export function parseSavedRoomPayload(value: unknown): {
  kind: "tactical-room";
  version: 2;
  room: RoomState;
  selectedHeroIds: string[];
} | null {
  const current = savedRoomPayloadSchema.safeParse(value);
  if (current.success)
    return current.data as {
      kind: "tactical-room";
      version: 2;
      room: RoomState;
      selectedHeroIds: string[];
    };

  const legacy = legacySavedRoomPayloadSchema.safeParse(value);
  if (!legacy.success) return null;
  return {
    kind: "tactical-room",
    version: 2,
    room: {
      ...legacy.data.room,
      version: 2,
      spawnPoints: [],
      processedSpawnRequestIds: [],
      nextEnemyInstanceSequence: 1,
      enemies: legacy.data.room.enemies.map((enemy) => ({
        ...enemy,
        creatureId: enemy.id,
      })),
    },
    selectedHeroIds: legacy.data.selectedHeroIds,
  };
}
