import { z } from "zod";
import { createInitialBrouhahaState, type RoomState } from "@gargotte/engine";
import {
  legacyRoomStateV1Schema,
  legacyRoomStateV2Schema,
  legacyRoomStateV3Schema,
  legacyRoomStateV4Schema,
  legacyRoomStateV5Schema,
  legacyRoomStateV6Schema,
  roomStateSchema,
} from "./room-state-schema";

const idSchema = z.string().min(1);

export const savedRoomPayloadSchema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(6),
    room: roomStateSchema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
  })
  .strict()
  .superRefine(validateSelectedHeroes);

const legacySavedRoomPayloadV6Schema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(6),
    room: legacyRoomStateV6Schema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
  })
  .strict()
  .superRefine(validateSelectedHeroes);

const legacySavedRoomPayloadV5Schema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(5),
    room: legacyRoomStateV5Schema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
  })
  .strict()
  .superRefine(validateSelectedHeroes);

const legacySavedRoomPayloadV4Schema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(4),
    room: legacyRoomStateV4Schema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
  })
  .strict()
  .superRefine(validateSelectedHeroes);

const legacySavedRoomPayloadV3Schema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(3),
    room: legacyRoomStateV3Schema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
  })
  .strict()
  .superRefine(validateSelectedHeroes);

const legacySavedRoomPayloadV2Schema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(2),
    room: legacyRoomStateV2Schema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
  })
  .strict()
  .superRefine(validateSelectedHeroes);

const legacySavedRoomPayloadV1Schema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(1),
    room: legacyRoomStateV1Schema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
  })
  .strict()
  .superRefine(validateSelectedHeroes);

function validateSelectedHeroes(
  payload: {
    room: { heroes: { id: string }[] };
    selectedHeroIds: string[];
  },
  context: z.RefinementCtx,
): void {
  const unique = new Set(payload.selectedHeroIds);
  if (unique.size !== payload.selectedHeroIds.length)
    context.addIssue({
      code: "custom",
      path: ["selectedHeroIds"],
      message: "les héros sélectionnés doivent être uniques",
    });
  const heroIds = new Set(payload.room.heroes.map((hero) => hero.id));
  for (const id of payload.selectedHeroIds)
    if (!heroIds.has(id))
      context.addIssue({
        code: "custom",
        path: ["selectedHeroIds"],
        message: `héros sélectionné absent de la salle: ${id}`,
      });
}

export function parseSavedRoomPayload(
  value: unknown,
): ReturnTypePayload | null {
  const current = savedRoomPayloadSchema.safeParse(value);
  if (current.success) return current.data as ReturnTypePayload;

  const legacyV6 = legacySavedRoomPayloadV6Schema.safeParse(value);
  if (legacyV6.success)
    return payload(
      migrateV6(legacyV6.data.room),
      legacyV6.data.selectedHeroIds,
    );

  const legacyV5 = legacySavedRoomPayloadV5Schema.safeParse(value);
  if (legacyV5.success)
    return payload(
      migrateV6(migrateV5(legacyV5.data.room)),
      legacyV5.data.selectedHeroIds,
    );

  const legacyV4 = legacySavedRoomPayloadV4Schema.safeParse(value);
  if (legacyV4.success)
    return payload(
      migrateV6(migrateV5(migrateV4(legacyV4.data.room))),
      legacyV4.data.selectedHeroIds,
    );

  const legacyV3 = legacySavedRoomPayloadV3Schema.safeParse(value);
  if (legacyV3.success)
    return payload(
      migrateV6(
        migrateV5(
          migrateV4({
            ...legacyV3.data.room,
            version: 4,
            interactables: [],
            processedInteractableRequestIds: [],
            nextInteractableInteractionSequence: 1,
          }),
        ),
      ),
      legacyV3.data.selectedHeroIds,
    );

  const legacyV2 = legacySavedRoomPayloadV2Schema.safeParse(value);
  if (legacyV2.success)
    return payload(
      migrateV6(
        migrateV5(
          migrateV4({
            ...legacyV2.data.room,
            version: 4,
            brouhaha: createInitialBrouhahaState(),
            interactables: [],
            processedInteractableRequestIds: [],
            nextInteractableInteractionSequence: 1,
          }),
        ),
      ),
      legacyV2.data.selectedHeroIds,
    );

  const legacyV1 = legacySavedRoomPayloadV1Schema.safeParse(value);
  if (!legacyV1.success) return null;
  return payload(
    migrateV6(
      migrateV5(
        migrateV4({
          ...legacyV1.data.room,
          version: 4,
          spawnPoints: [],
          processedSpawnRequestIds: [],
          nextEnemyInstanceSequence: 1,
          brouhaha: createInitialBrouhahaState(),
          interactables: [],
          processedInteractableRequestIds: [],
          nextInteractableInteractionSequence: 1,
          enemies: legacyV1.data.room.enemies.map((enemy) => ({
            ...enemy,
            creatureId: enemy.id,
          })),
        }),
      ),
    ),
    legacyV1.data.selectedHeroIds,
  );
}

type ReturnTypePayload = {
  kind: "tactical-room";
  version: 6;
  room: RoomState;
  selectedHeroIds: string[];
};

function payload(
  room: RoomState,
  selectedHeroIds: string[],
): ReturnTypePayload {
  return {
    kind: "tactical-room",
    version: 6,
    room,
    selectedHeroIds,
  };
}

function migrateV4(
  room: z.infer<typeof legacyRoomStateV4Schema>,
): z.infer<typeof legacyRoomStateV5Schema> {
  return {
    ...room,
    version: 5,
    nextChainReactionSequence: 1,
    chainReactionHistory: [],
  };
}

function migrateV5(
  room: z.infer<typeof legacyRoomStateV5Schema>,
): z.infer<typeof legacyRoomStateV6Schema> {
  return {
    ...room,
    version: 6,
    nextBrouhahaReinforcementSequence: 1,
    brouhahaReinforcementHistory: [],
  };
}

function migrateV6(
  room: z.infer<typeof legacyRoomStateV6Schema>,
): RoomState {
  return {
    ...room,
    enemyTurnRoster:
      room.phase === "enemy-turn"
        ? room.enemies
            .filter((enemy) => enemy.alive)
            .map((enemy) => enemy.id)
            .sort((a, b) => a.localeCompare(b))
        : [],
  };
}
