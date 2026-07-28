import { z } from "zod";
import type { ExpeditionState } from "@gargotte/engine";
import { roomStateSchema } from "./room-state-schema";

const idSchema = z.string().min(1);
const persistentHeroSchema = z
  .object({
    id: idSchema,
    hp: z.number().int().nonnegative(),
    maxHp: z.number().int().positive(),
    alive: z.boolean(),
  })
  .strict()
  .refine((hero) => hero.hp <= hero.maxHp, {
    message: "les PV persistants dépassent les PV maximum",
  })
  .refine((hero) => hero.alive === (hero.hp > 0), {
    message: "l’état vivant doit correspondre aux PV persistants",
  });

const roomSummarySchema = z
  .object({
    roomId: idSchema,
    turns: z.number().int().positive(),
    finalBrouhahaLevel: z.number().int().min(0).max(12),
    defeatedEnemies: z.number().int().nonnegative(),
    completed: z.boolean(),
  })
  .strict();

const expeditionResultSchema = z
  .object({
    outcome: z.enum(["victory", "defeat"]),
    totalTurns: z.number().int().nonnegative(),
    defeatedEnemies: z.number().int().nonnegative(),
    heroes: z.array(persistentHeroSchema).min(1).max(4),
    rooms: z.array(roomSummarySchema).min(1).max(3),
  })
  .strict();

export const expeditionStateSchema = z
  .object({
    version: z.literal(1),
    id: idSchema,
    definitionId: idSchema,
    selectedHeroIds: z.array(idSchema).min(1).max(4),
    currentRoomId: idSchema.nullable(),
    orderedRoomIds: z.tuple([idSchema, idSchema, idSchema]),
    visitedRoomIds: z.array(idSchema).max(3),
    completedRoomIds: z.array(idSchema).max(3),
    persistentHeroes: z.array(persistentHeroSchema).min(1).max(4),
    roomStates: z.record(idSchema, roomStateSchema),
    status: z.enum(["preparation", "in-progress", "victory", "defeat"]),
    result: expeditionResultSchema.nullable(),
  })
  .strict()
  .superRefine(validateExpeditionState);

export const savedExpeditionPayloadSchema = z
  .object({
    kind: z.literal("expedition"),
    version: z.literal(1),
    expedition: expeditionStateSchema,
    diagnosticMode: z.boolean(),
  })
  .strict();

export interface SavedExpeditionPayload {
  kind: "expedition";
  version: 1;
  expedition: ExpeditionState;
  diagnosticMode: boolean;
}

export function parseSavedExpeditionPayload(
  value: unknown,
): SavedExpeditionPayload | null {
  const parsed = savedExpeditionPayloadSchema.safeParse(value);
  return parsed.success ? (parsed.data as SavedExpeditionPayload) : null;
}

function validateExpeditionState(
  state: z.infer<typeof expeditionStateSchema>,
  context: z.RefinementCtx,
): void {
  validateUnique(state.selectedHeroIds, "selectedHeroIds", context);
  validateUnique(state.orderedRoomIds, "orderedRoomIds", context);
  validateUnique(state.visitedRoomIds, "visitedRoomIds", context);
  validateUnique(state.completedRoomIds, "completedRoomIds", context);
  validateUnique(
    state.persistentHeroes.map((hero) => hero.id),
    "persistentHeroes",
    context,
  );

  const ordered = new Set(state.orderedRoomIds);
  const visited = new Set(state.visitedRoomIds);
  const completed = new Set(state.completedRoomIds);
  const persistent = new Set(state.persistentHeroes.map((hero) => hero.id));
  for (const id of state.selectedHeroIds)
    if (!persistent.has(id))
      issue(context, ["persistentHeroes"], `héros persistant absent: ${id}`);
  for (const id of state.visitedRoomIds)
    if (!ordered.has(id))
      issue(context, ["visitedRoomIds"], `salle visitée inconnue: ${id}`);
  for (const id of state.completedRoomIds)
    if (!visited.has(id))
      issue(context, ["completedRoomIds"], `salle terminée non visitée: ${id}`);

  for (const [roomId, room] of Object.entries(state.roomStates)) {
    if (!ordered.has(roomId))
      issue(context, ["roomStates", roomId], "état de salle hors expédition");
    if (!visited.has(roomId))
      issue(context, ["roomStates", roomId], "état de salle non visitée");
    if (room.scenarioId !== roomId)
      issue(context, ["roomStates", roomId], "identité de salle incohérente");
    if (room.phase === "victory" && !completed.has(roomId))
      issue(context, ["completedRoomIds"], `${roomId} doit être terminée`);
    if (completed.has(roomId) && room.phase !== "victory")
      issue(context, ["roomStates", roomId, "phase"], "salle terminée sans victoire locale");
  }

  if (state.status === "preparation") {
    if (state.currentRoomId !== null || state.visitedRoomIds.length > 0)
      issue(context, ["status"], "une expédition en préparation ne contient aucune salle active");
    if (state.result !== null)
      issue(context, ["result"], "une expédition en préparation ne possède pas de résultat");
    return;
  }

  if (!state.currentRoomId || !visited.has(state.currentRoomId))
    issue(context, ["currentRoomId"], "la salle courante doit être visitée");
  if (state.currentRoomId && !state.roomStates[state.currentRoomId])
    issue(context, ["roomStates"], "l’état de la salle courante est absent");

  if (state.status === "in-progress" && state.result !== null)
    issue(context, ["result"], "une expédition active ne possède pas de résultat");
  if (state.status === "victory") {
    if (state.result?.outcome !== "victory")
      issue(context, ["result"], "le résultat de victoire est absent");
    const lastRoomId = state.orderedRoomIds[2];
    if (!completed.has(lastRoomId))
      issue(context, ["completedRoomIds"], "la troisième salle doit être terminée");
  }
  if (state.status === "defeat" && state.result?.outcome !== "defeat")
    issue(context, ["result"], "le résultat de défaite est absent");
}

function validateUnique(
  values: readonly string[],
  path: string,
  context: z.RefinementCtx,
): void {
  if (new Set(values).size !== values.length)
    issue(context, [path], "les identifiants doivent être uniques");
}

function issue(
  context: z.RefinementCtx,
  path: PropertyKey[],
  message: string,
): void {
  context.addIssue({ code: "custom", path, message });
}
