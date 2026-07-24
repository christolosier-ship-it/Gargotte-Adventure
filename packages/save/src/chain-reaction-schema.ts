import { z } from "zod";

const idSchema = z.string().min(1);

export const chainReactionHistoryEntrySchema = z
  .object({
    id: idSchema,
    rootRequestId: idSchema,
    sequence: z.number().int().positive(),
    reactionDefinitionId: idSchema,
    triggerType: z.enum(["state-entered", "moved"]),
    sourceInstanceId: idSchema,
    parentReactionId: idSchema.nullable(),
    actionIndex: z.number().int().nonnegative(),
    actionType: z.enum(["transition", "move", "damage", "brouhaha", "guard"]),
    targetId: idSchema.nullable(),
    outcome: z.enum(["applied", "skipped", "guarded"]),
    details: z.array(z.string()),
  })
  .strict();
