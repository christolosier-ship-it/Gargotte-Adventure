import { z } from "zod";
import type { GameState } from "@gargotte/engine";

export { brouhahaStateSchema } from "./brouhaha-schema";
export {
  legacyRoomStateV1Schema,
  legacyRoomStateV2Schema,
  roomStateSchema,
} from "./room-state-schema";
export {
  parseSavedRoomPayload,
  savedRoomPayloadSchema,
} from "./saved-room-schema";

export const gameStateSchema = z
  .object({
    version: z.literal(1),
    phase: z.enum(["boot", "menu", "expedition"]),
    seed: z.number().int().nonnegative(),
    expeditionNumber: z.number().int().nonnegative(),
    lastEventId: z.string().min(1).nullable(),
  })
  .strict();

export function parseSavedGameState(value: unknown): GameState | null {
  const parsed = gameStateSchema.safeParse(value);
  return parsed.success ? (parsed.data as GameState) : null;
}
