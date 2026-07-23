import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const brouhahaEffectScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("universal") }).strict(),
  z
    .object({
      type: z.literal("dungeon"),
      dungeonId: slugSchema,
    })
    .strict(),
]);

export const brouhahaEffectDefinitionSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    description: z.string().min(1),
    scope: brouhahaEffectScopeSchema,
    minLevel: z.number().int().min(0).max(12),
    maxLevel: z.number().int().min(0).max(12),
  })
  .strict()
  .refine((effect) => effect.minLevel <= effect.maxLevel, {
    message: "minLevel doit être inférieur ou égal à maxLevel",
  });

export const brouhahaEffectCatalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    effects: z.array(brouhahaEffectDefinitionSchema).min(2),
  })
  .strict()
  .superRefine((catalog, context) => {
    const ids = new Set<string>();
    for (const effect of catalog.effects) {
      if (ids.has(effect.id))
        context.addIssue({
          code: "custom",
          message: `identifiant d'effet de Brouhaha dupliqué ${effect.id}`,
        });
      ids.add(effect.id);
    }

    const universal = catalog.effects.filter(
      (effect) => effect.scope.type === "universal",
    );
    for (let level = 0; level <= 12; level += 1) {
      const eligible = universal.filter(
        (effect) => effect.minLevel <= level && effect.maxLevel >= level,
      );
      const expected = level >= 10 ? 2 : 1;
      if (eligible.length < expected)
        context.addIssue({
          code: "custom",
          message: `niveau ${level}: ${expected} effet(s) universel(s) requis, ${eligible.length} disponible(s)`,
        });
    }
  });

export type BrouhahaEffectDefinition = z.infer<
  typeof brouhahaEffectDefinitionSchema
>;
export type BrouhahaEffectCatalog = z.infer<typeof brouhahaEffectCatalogSchema>;

export function parseBrouhahaEffectCatalog(
  value: unknown,
): BrouhahaEffectCatalog {
  return brouhahaEffectCatalogSchema.parse(value);
}
