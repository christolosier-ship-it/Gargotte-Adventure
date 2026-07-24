import { z } from "zod";

const idSchema = z.string().min(1);

export const brouhahaReinforcementHistoryEntrySchema = z
  .object({
    id: idSchema,
    sequence: z.number().int().positive(),
    reinforcementDefinitionId: idSchema,
    brouhahaRequestId: idSchema,
    previousLevel: z.number().int().min(0).max(12),
    level: z.number().int().min(0).max(12),
    threshold: z.number().int().min(1).max(12),
    activation: z.number().int().positive(),
    spawnRequestId: idSchema,
    result: z.enum(["succeeded", "partial", "rejected"]),
    createdInstanceIds: z.array(idSchema),
    details: z.array(z.string()),
  })
  .strict()
  .superRefine((entry, context) => {
    if (!(entry.previousLevel < entry.threshold && entry.threshold <= entry.level))
      context.addIssue({
        code: "custom",
        message: "le seuil doit avoir été franchi à la hausse",
      });
    if (new Set(entry.createdInstanceIds).size !== entry.createdInstanceIds.length)
      context.addIssue({
        code: "custom",
        path: ["createdInstanceIds"],
        message: "les instances créées doivent être uniques",
      });
    if (entry.result === "rejected" && entry.createdInstanceIds.length > 0)
      context.addIssue({
        code: "custom",
        path: ["createdInstanceIds"],
        message: "un renfort refusé ne peut pas contenir d'instance créée",
      });
    if (entry.result !== "rejected" && entry.createdInstanceIds.length === 0)
      context.addIssue({
        code: "custom",
        path: ["createdInstanceIds"],
        message: "un renfort réussi ou partiel doit créer une instance",
      });
  });
