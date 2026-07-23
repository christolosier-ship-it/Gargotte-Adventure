import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const interactableStateDefinitionSchema = z
  .object({
    id: slugSchema,
    label: z.string().min(1),
    blocksMovement: z.boolean(),
    blocksLineOfSight: z.boolean(),
  })
  .strict();

export const interactableInteractionDefinitionSchema = z
  .object({
    id: slugSchema,
    label: z.string().min(1),
    fromStateId: slugSchema,
    toStateId: slugSchema,
    brouhahaDelta: z.number().int().min(-12).max(12),
    reason: z.string().min(1),
  })
  .strict();

export const interactableDefinitionSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    kind: z.enum(["table", "barrel", "gate", "torch", "pillar"]),
    initialStateId: slugSchema,
    states: z.array(interactableStateDefinitionSchema).min(2),
    interactions: z.array(interactableInteractionDefinitionSchema).min(1),
  })
  .strict()
  .superRefine((definition, context) => {
    const stateIds = new Set<string>();
    for (const state of definition.states) {
      if (stateIds.has(state.id))
        context.addIssue({
          code: "custom",
          message: `${definition.id}: état dupliqué ${state.id}`,
        });
      stateIds.add(state.id);
    }
    if (!stateIds.has(definition.initialStateId))
      context.addIssue({
        code: "custom",
        message: `${definition.id}: état initial absent ${definition.initialStateId}`,
      });

    const interactionIds = new Set<string>();
    for (const interaction of definition.interactions) {
      if (interactionIds.has(interaction.id))
        context.addIssue({
          code: "custom",
          message: `${definition.id}: interaction dupliquée ${interaction.id}`,
        });
      interactionIds.add(interaction.id);
      if (!stateIds.has(interaction.fromStateId))
        context.addIssue({
          code: "custom",
          message: `${definition.id}/${interaction.id}: état source absent ${interaction.fromStateId}`,
        });
      if (!stateIds.has(interaction.toStateId))
        context.addIssue({
          code: "custom",
          message: `${definition.id}/${interaction.id}: état cible absent ${interaction.toStateId}`,
        });
      if (interaction.fromStateId === interaction.toStateId)
        context.addIssue({
          code: "custom",
          message: `${definition.id}/${interaction.id}: la transition doit changer l'état`,
        });
    }
  });

export const interactableCatalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    interactables: z.array(interactableDefinitionSchema).min(1),
  })
  .strict()
  .superRefine((catalog, context) => {
    const ids = new Set<string>();
    for (const definition of catalog.interactables) {
      if (ids.has(definition.id))
        context.addIssue({
          code: "custom",
          message: `identifiant d'objet dupliqué ${definition.id}`,
        });
      ids.add(definition.id);
    }
  });

export type InteractableStateDefinition = z.infer<
  typeof interactableStateDefinitionSchema
>;
export type InteractableInteractionDefinition = z.infer<
  typeof interactableInteractionDefinitionSchema
>;
export type InteractableDefinition = z.infer<typeof interactableDefinitionSchema>;
export type InteractableCatalog = z.infer<typeof interactableCatalogSchema>;

export function parseInteractableCatalog(value: unknown): InteractableCatalog {
  return interactableCatalogSchema.parse(value);
}
