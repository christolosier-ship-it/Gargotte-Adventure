import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const gridPositionSchema = z
  .object({
    column: z.number().int().nonnegative(),
    row: z.number().int().nonnegative(),
  })
  .strict();
const gridOffsetSchema = z
  .object({
    column: z.number().int().min(-1).max(1),
    row: z.number().int().min(-1).max(1),
  })
  .strict()
  .refine(
    (offset) => Math.abs(offset.column) + Math.abs(offset.row) === 1,
    "le déplacement doit être orthogonal d'une case",
  );

export const chainReactionTriggerSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("state-entered"),
      interactableInstanceId: slugSchema,
      stateId: slugSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("moved"),
      interactableInstanceId: slugSchema,
      position: gridPositionSchema.optional(),
    })
    .strict(),
]);

export const chainReactionActionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("transition"),
      targetInstanceId: slugSchema,
      interactionId: slugSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("move"),
      targetInstanceId: slugSchema,
      offset: gridOffsetSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("damage"),
      centerInstanceId: slugSchema,
      radius: z.number().int().min(0).max(8),
      amount: z.number().int().positive().max(99),
    })
    .strict(),
  z
    .object({
      type: z.literal("brouhaha"),
      delta: z.number().int().min(-12).max(12).refine((value) => value !== 0),
      reason: z.string().min(1),
    })
    .strict(),
]);

export const chainReactionDefinitionSchema = z
  .object({
    id: slugSchema,
    trigger: chainReactionTriggerSchema,
    actions: z.array(chainReactionActionSchema).min(1),
  })
  .strict();

export type ChainReactionTriggerDefinition = z.infer<
  typeof chainReactionTriggerSchema
>;
export type ChainReactionActionDefinition = z.infer<
  typeof chainReactionActionSchema
>;
export type ChainReactionDefinition = z.infer<
  typeof chainReactionDefinitionSchema
>;
