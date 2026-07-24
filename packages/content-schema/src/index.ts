import { z } from "zod";

export {
  brouhahaEffectCatalogSchema,
  brouhahaEffectDefinitionSchema,
  parseBrouhahaEffectCatalog,
} from "./brouhaha";
export type {
  BrouhahaEffectCatalog,
  BrouhahaEffectDefinition,
} from "./brouhaha";
export {
  brouhahaReinforcementDefinitionSchema,
} from "./brouhaha-reinforcements";
export type {
  BrouhahaReinforcementDefinition,
} from "./brouhaha-reinforcements";
export {
  chainReactionActionSchema,
  chainReactionDefinitionSchema,
  chainReactionTriggerSchema,
} from "./chain-reactions";
export type {
  ChainReactionActionDefinition,
  ChainReactionDefinition,
  ChainReactionTriggerDefinition,
} from "./chain-reactions";
export {
  interactableCatalogSchema,
  interactableDefinitionSchema,
  interactableInteractionDefinitionSchema,
  interactableMovementDefinitionSchema,
  interactableStateDefinitionSchema,
  parseInteractableCatalog,
} from "./interactables";
export type {
  InteractableCatalog,
  InteractableDefinition,
  InteractableInteractionDefinition,
  InteractableMovementDefinition,
  InteractableStateDefinition,
} from "./interactables";
export { parseTacticalRoom, tacticalRoomSchema } from "./tactical-room";
export type { TacticalRoomDefinition } from "./tactical-room";

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
