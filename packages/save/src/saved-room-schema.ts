import { z } from "zod";
import { createInitialBrouhahaState, type RoomState } from "@gargotte/engine";
import {
  legacyRoomStateV1Schema,
  legacyRoomStateV2Schema,
  roomStateSchema,
} from "./room-state-schema";

const idSchema = z.string().min(1);

export const savedRoomPayloadSchema = z
  .object({
    kind: z.literal("tactical-room"),
    version: z.literal(3),
    room: roomStateSchema,
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

export function parseSavedRoomPayload(value: unknown): {
  kind: "tactical-room";
  version: 3;
  room: RoomState;
  selectedHeroIds: string[];
} | null {
  const current = savedRoomPayloadSchema.safeParse(value);
  if (current.success)
    return current.data as {
      kind: "tactical-room";
      version: 3;
      room: RoomState;
      selectedHeroIds: string[];
    };

  const legacyV2 = legacySavedRoomPayloadV2Schema.safeParse(value);
  if (legacyV2.success)
    return {
      kind: "tactical-room",
      version: 3,
      room: {
        ...legacyV2.data.room,
        version: 3,
        brouhaha: createInitialBrouhahaState(),
      },
      selectedHeroIds: legacyV2.data.selectedHeroIds,
    };

  const legacyV1 = legacySavedRoomPayloadV1Schema.safeParse(value);
  if (!legacyV1.success) return null;
  return {
    kind: "tactical-room",
    version: 3,
    room: {
      ...legacyV1.data.room,
      version: 3,
      spawnPoints: [],
      processedSpawnRequestIds: [],
      nextEnemyInstanceSequence: 1,
      brouhaha: createInitialBrouhahaState(),
      enemies: legacyV1.data.room.enemies.map((enemy) => ({
        ...enemy,
        creatureId: enemy.id,
      })),
    },
    selectedHeroIds: legacyV1.data.selectedHeroIds,
  };
}
