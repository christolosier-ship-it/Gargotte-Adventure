import { z } from 'zod';

export const contentManifestSchema = z.object({
  schemaVersion: z.literal(1),
  packId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  source: z.object({
    kind: z.enum(['gargottex-export', 'hand-authored']),
    reference: z.string().min(1)
  }),
  generatedAt: z.iso.datetime(),
  contentHash: z.string().min(8),
  files: z.array(z.string().min(1)).min(1)
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
    z.number().int().positive()
  ]),
  bossId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(['foundation-placeholder', 'playable'])
});

export type ContentManifest = z.infer<typeof contentManifestSchema>;
export type DungeonDefinition = z.infer<typeof dungeonSchema>;

export function parseContentManifest(value: unknown): ContentManifest {
  return contentManifestSchema.parse(value);
}

export function parseDungeon(value: unknown): DungeonDefinition {
  return dungeonSchema.parse(value);
}
