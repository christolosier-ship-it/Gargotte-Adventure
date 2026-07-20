import { z } from "zod";

export const contentManifestSchema = z.object({
  schemaVersion: z.literal(1),
  packId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
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
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  subtitle: z.string().min(1),
  floorBudgets: z.tuple([
    z.number().int().positive(),
    z.number().int().positive(),
    z.number().int().positive(),
    z.number().int().positive(),
    z.number().int().positive(),
  ]),
  bossId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(["foundation-placeholder", "playable"]),
});

export type ContentManifest = z.infer<typeof contentManifestSchema>;
export type DungeonDefinition = z.infer<typeof dungeonSchema>;

export function parseContentManifest(value: unknown): ContentManifest {
  return contentManifestSchema.parse(value);
}

export function parseDungeon(value: unknown): DungeonDefinition {
  return dungeonSchema.parse(value);
}

const gridPositionSchema = z.object({
  column: z.number().int().nonnegative(),
  row: z.number().int().nonnegative(),
});
const actorSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    position: gridPositionSchema,
    hp: z.number().int().positive(),
    maxHp: z.number().int().positive(),
    atk: z.number().int().nonnegative(),
    def: z.number().int().nonnegative(),
    range: z.number().int().positive(),
  })
  .refine((a) => a.hp <= a.maxHp, "hp doit être inférieur ou égal à maxHp");
export const tacticalRoomSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1),
    grid: z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
    obstacles: z.array(gridPositionSchema),
    heroes: z.array(actorSchema).length(4),
    enemies: z.array(actorSchema).min(2),
    notes: z.string().min(1),
  })
  .superRefine((room, ctx) => {
    const seen = new Map<string, string>();
    const ids = new Set<string>();
    const addPos = (p: { column: number; row: number }, label: string) => {
      if (p.column >= room.grid.width || p.row >= room.grid.height)
        ctx.addIssue({ code: "custom", message: `${label} hors plateau` });
      const key = `${p.column},${p.row}`;
      const other = seen.get(key);
      if (other)
        ctx.addIssue({
          code: "custom",
          message: `position dupliquée ${label} avec ${other}`,
        });
      seen.set(key, label);
    };
    for (const o of room.obstacles) addPos(o, "obstacle");
    for (const a of [...room.heroes, ...room.enemies]) {
      if (ids.has(a.id))
        ctx.addIssue({
          code: "custom",
          message: `identifiant dupliqué ${a.id}`,
        });
      ids.add(a.id);
      if (
        room.obstacles.some(
          (o) => o.column === a.position.column && o.row === a.position.row,
        )
      )
        ctx.addIssue({
          code: "custom",
          message: `acteur sur obstacle ${a.id}`,
        });
      addPos(a.position, a.id);
    }
  });
export type TacticalRoomDefinition = z.infer<typeof tacticalRoomSchema>;
export function parseTacticalRoom(value: unknown): TacticalRoomDefinition {
  return tacticalRoomSchema.parse(value);
}
