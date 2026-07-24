import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const brouhahaReinforcementDefinitionSchema = z
  .object({
    id: slugSchema,
    threshold: z.number().int().min(1).max(12),
    creatureId: slugSchema,
    quantity: z.number().int().positive(),
    candidateSpawnPointIds: z.array(slugSchema).min(1),
    failureMode: z.enum(["all-or-nothing", "partial"]),
    maxActivations: z.number().int().positive(),
  })
  .strict()
  .superRefine((definition, context) => {
    if (
      new Set(definition.candidateSpawnPointIds).size !==
      definition.candidateSpawnPointIds.length
    )
      context.addIssue({
        code: "custom",
        path: ["candidateSpawnPointIds"],
        message: "les points candidats doivent être uniques",
      });
  });

export type BrouhahaReinforcementDefinition = z.infer<
  typeof brouhahaReinforcementDefinitionSchema
>;
