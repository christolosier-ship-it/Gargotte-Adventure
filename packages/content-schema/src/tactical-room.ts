import { z } from "zod";
import { brouhahaReinforcementDefinitionSchema } from "./brouhaha-reinforcements";
import { chainReactionDefinitionSchema } from "./chain-reactions";
import {
  validateCurrentRoom,
  validateLegacyRoom,
} from "./tactical-room-validation";

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
  .superRefine(validateCurrentRoom);

const legacyTacticalRoomSchema = z
  .object({
    schemaVersion: z.literal(5),
    ...commonRoomFields,
    enemies: z.array(initialCreaturePlacementSchema).min(1),
  })
  .strict()
  .superRefine(validateLegacyRoom);

export type TacticalRoomDefinition = z.infer<typeof tacticalRoomSchema>;

export function parseTacticalRoom(value: unknown): TacticalRoomDefinition {
  const current = tacticalRoomSchema.safeParse(value);
  if (current.success) return current.data;

  const legacy = legacyTacticalRoomSchema.safeParse(value);
  if (!legacy.success) return tacticalRoomSchema.parse(value);
  const { enemies, ...room } = legacy.data;
  return tacticalRoomSchema.parse({
    ...room,
    schemaVersion: 6,
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
      failureMode: "all-or-nothing",
    })),
  });
}
