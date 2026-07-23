import { z } from "zod";

const idSchema = z.string().min(1);
const gridPositionSchema = z
  .object({
    column: z.number().int().nonnegative(),
    row: z.number().int().nonnegative(),
  })
  .strict();

export const interactableInstanceSchema = z
  .object({
    id: idSchema,
    interactableId: idSchema,
    name: z.string().min(1),
    kind: z.enum(["table", "barrel", "gate", "torch", "pillar"]),
    position: gridPositionSchema,
    stateId: idSchema,
    blocksMovement: z.boolean(),
    blocksLineOfSight: z.boolean(),
  })
  .strict();
