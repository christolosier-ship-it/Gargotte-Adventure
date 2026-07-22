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
  })
  .strict()
  .superRefine(validateCombatant);

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

export const roomStateSchema = z
  .object({
    version: z.literal(1),
    scenarioId: idSchema,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    obstacles: z.array(gridPositionSchema),
    heroes: z.array(heroSchema).min(1),
    enemies: z.array(enemySchema).min(1),
    activeHeroId: idSchema.nullable(),
    phase: z.enum(["heroes-turn", "enemy-turn", "victory", "defeat"]),
    turn: z.number().int().positive(),
  })
  .strict()
  .superRefine((room, context) => {
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

    if (
      room.activeHeroId &&
      !room.heroes.some((hero) => hero.id === room.activeHeroId && hero.alive)
    )
      context.addIssue({
        code: "custom",
        path: ["activeHeroId"],
        message: "le héros actif doit exister et être vivant",
      });
  });

export const savedRoomPayloadSchema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(1),
    room: roomStateSchema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
  })
  .strict()
  .superRefine((payload, context) => {
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
  });

export function parseSavedGameState(value: unknown): GameState | null {
  const parsed = gameStateSchema.safeParse(value);
  return parsed.success ? (parsed.data as GameState) : null;
}

export function parseSavedRoomPayload(value: unknown): {
  kind: "tactical-room";
  version: 1;
  room: RoomState;
  selectedHeroIds: string[];
} | null {
  const parsed = savedRoomPayloadSchema.safeParse(value);
  return parsed.success
    ? (parsed.data as {
        kind: "tactical-room";
        version: 1;
        room: RoomState;
        selectedHeroIds: string[];
      })
    : null;
}
