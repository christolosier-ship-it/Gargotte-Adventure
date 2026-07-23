import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const contentManifestSchema = z.object({
  schemaVersion: z.literal(1),
  packId: slugSchema,
  title: z.string().min(1),
  source: z.object({
    kind: z.enum(["gargottex-export", "hand-authored"]),
    reference: z.string().min(1),
  }),
  generatedAt: z.iso.datetime(),
  contentHash: z.string().min(8),
  files: z.array(z.string().min(1)).min(1),
});

export const dungeonSchema = z.object({
  schemaVersion: z.literal(1),
  id: slugSchema,
  name: z.string().min(1),
  subtitle: z.string().min(1),
  floorBudgets: z.tuple([
    z.number().int().positive(),
    z.number().int().positive(),
    z.number().int().positive(),
    z.number().int().positive(),
    z.number().int().positive(),
  ]),
  bossId: slugSchema,
  status: z.enum(["foundation-placeholder", "playable"]),
});

export const creatureDefinitionSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    category: z.enum([
      "basique",
      "tactique",
      "speciale",
      "brute",
      "mini-boss",
      "boss",
    ]),
    menace: z.number().int().positive(),
    maxHp: z.number().int().positive(),
    atk: z.number().int().nonnegative(),
    def: z.number().int().nonnegative(),
    range: z.number().int().positive(),
    blocksMovement: z.boolean(),
    tags: z.array(slugSchema),
  })
  .strict();

export const creatureCatalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    creatures: z.array(creatureDefinitionSchema).min(1),
  })
  .strict()
  .superRefine((catalog, context) => {
    const ids = new Set<string>();
    for (const creature of catalog.creatures) {
      if (ids.has(creature.id))
        context.addIssue({
          code: "custom",
          message: `identifiant de créature dupliqué ${creature.id}`,
        });
      ids.add(creature.id);
    }
  });

export type ContentManifest = z.infer<typeof contentManifestSchema>;
export type DungeonDefinition = z.infer<typeof dungeonSchema>;
export type CreatureDefinition = z.infer<typeof creatureDefinitionSchema>;
export type CreatureCatalog = z.infer<typeof creatureCatalogSchema>;

export function parseContentManifest(value: unknown): ContentManifest {
  return contentManifestSchema.parse(value);
}

export function parseDungeon(value: unknown): DungeonDefinition {
  return dungeonSchema.parse(value);
}

export function parseCreatureCatalog(value: unknown): CreatureCatalog {
  return creatureCatalogSchema.parse(value);
}

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

const spawnPointSchema = z
  .object({
    id: slugSchema,
    position: gridPositionSchema,
    tags: z.array(slugSchema),
    enabled: z.boolean(),
  })
  .strict();

const scriptedSpawnSchema = z
  .object({
    id: slugSchema,
    label: z.string().min(1),
    creatureId: slugSchema,
    quantity: z.number().int().positive(),
    candidateSpawnPointIds: z.array(slugSchema).min(1),
    failureMode: z.enum(["all-or-nothing", "partial"]),
  })
  .strict();

export const tacticalRoomSchema = z
  .object({
    schemaVersion: z.literal(2),
    id: slugSchema,
    name: z.string().min(1),
    grid: z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
    obstacles: z.array(gridPositionSchema),
    spawnPoints: z.array(spawnPointSchema),
    scriptedSpawns: z.array(scriptedSpawnSchema),
    heroes: z.array(actorSchema).length(4),
    enemies: z.array(initialCreaturePlacementSchema).min(1),
    notes: z.string().min(1),
  })
  .strict()
  .superRefine((room, context) => {
    const occupied = new Map<string, string>();
    const actorIds = new Set<string>();
    const spawnPointIds = new Set<string>();
    const scriptedSpawnIds = new Set<string>();
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

    for (const actor of [...room.heroes, ...room.enemies]) {
      if (actorIds.has(actor.id))
        context.addIssue({
          code: "custom",
          message: `identifiant d'instance dupliqué ${actor.id}`,
        });
      actorIds.add(actor.id);
      addBlockingPosition(actor.position, actor.id);
    }

    for (const point of room.spawnPoints) {
      if (spawnPointIds.has(point.id))
        context.addIssue({
          code: "custom",
          message: `point de spawn dupliqué ${point.id}`,
        });
      spawnPointIds.add(point.id);
      validatePosition(room, point.position, point.id, context);
    }

    for (const scripted of room.scriptedSpawns) {
      if (scriptedSpawnIds.has(scripted.id))
        context.addIssue({
          code: "custom",
          message: `spawn scripté dupliqué ${scripted.id}`,
        });
      scriptedSpawnIds.add(scripted.id);
      for (const pointId of scripted.candidateSpawnPointIds)
        if (!spawnPointIds.has(pointId))
          context.addIssue({
            code: "custom",
            message: `${scripted.id} référence un point absent: ${pointId}`,
          });
    }
  });

function validatePosition(
  room: { grid: { width: number; height: number } },
  position: { column: number; row: number },
  label: string,
  context: z.RefinementCtx,
): void {
  if (
    position.column >= room.grid.width ||
    position.row >= room.grid.height
  )
    context.addIssue({ code: "custom", message: `${label} hors plateau` });
}

export type TacticalRoomDefinition = z.infer<typeof tacticalRoomSchema>;

export function parseTacticalRoom(value: unknown): TacticalRoomDefinition {
  return tacticalRoomSchema.parse(value);
}
