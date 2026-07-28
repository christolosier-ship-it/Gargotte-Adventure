import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const expeditionRoomDefinitionSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    objective: z.string().min(1),
    roomContentId: slugSchema,
    entryId: slugSchema,
    exitId: slugSchema.nullable(),
    nextRoomId: slugSchema.nullable(),
    introduction: z.string().min(1),
  })
  .strict();

export const roomConnectionDefinitionSchema = z
  .object({
    id: slugSchema,
    fromRoomId: slugSchema,
    exitId: slugSchema,
    toRoomId: slugSchema,
    targetEntryId: slugSchema,
    label: z.string().min(1),
  })
  .strict();

export const expeditionDefinitionSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: slugSchema,
    name: z.string().min(1),
    introduction: z.string().min(1),
    roomIds: z.tuple([slugSchema, slugSchema, slugSchema]),
    entryRoomId: slugSchema,
    rooms: z.array(expeditionRoomDefinitionSchema).length(3),
    connections: z.array(roomConnectionDefinitionSchema).length(2),
    victoryText: z.string().min(1),
    defeatText: z.string().min(1),
  })
  .strict()
  .superRefine((definition, context) => {
    const orderedIds = [...definition.roomIds];
    if (new Set(orderedIds).size !== orderedIds.length)
      context.addIssue({
        code: "custom",
        path: ["roomIds"],
        message: "les trois salles doivent être uniques",
      });

    const roomsById = new Map<string, z.infer<typeof expeditionRoomDefinitionSchema>>();
    for (const room of definition.rooms) {
      if (roomsById.has(room.id))
        context.addIssue({
          code: "custom",
          path: ["rooms"],
          message: `salle dupliquée ${room.id}`,
        });
      roomsById.set(room.id, room);
    }

    if (definition.entryRoomId !== orderedIds[0])
      context.addIssue({
        code: "custom",
        path: ["entryRoomId"],
        message: "la salle d’entrée doit être la première salle déclarée",
      });

    for (const [index, roomId] of orderedIds.entries()) {
      const room = roomsById.get(roomId);
      if (!room) {
        context.addIssue({
          code: "custom",
          path: ["roomIds", index],
          message: `définition de salle absente ${roomId}`,
        });
        continue;
      }
      if (room.roomContentId !== room.id)
        context.addIssue({
          code: "custom",
          path: ["rooms", index, "roomContentId"],
          message: `${room.id}: la référence de contenu doit correspondre à l’identifiant de salle`,
        });
      const expectedNext = orderedIds[index + 1] ?? null;
      if (room.nextRoomId !== expectedNext)
        context.addIssue({
          code: "custom",
          path: ["rooms", index, "nextRoomId"],
          message: `${room.id}: salle suivante attendue ${expectedNext ?? "aucune"}`,
        });
      if ((expectedNext === null) !== (room.exitId === null))
        context.addIssue({
          code: "custom",
          path: ["rooms", index, "exitId"],
          message: `${room.id}: la dernière salle ne possède pas de sortie, les autres en exigent une`,
        });
    }

    const connectionIds = new Set<string>();
    for (const [index, connection] of definition.connections.entries()) {
      if (connectionIds.has(connection.id))
        context.addIssue({
          code: "custom",
          path: ["connections", index, "id"],
          message: `connexion dupliquée ${connection.id}`,
        });
      connectionIds.add(connection.id);
      const expectedFrom = orderedIds[index];
      const expectedTo = orderedIds[index + 1];
      if (connection.fromRoomId !== expectedFrom || connection.toRoomId !== expectedTo)
        context.addIssue({
          code: "custom",
          path: ["connections", index],
          message: `connexion attendue ${expectedFrom} vers ${expectedTo}`,
        });
      const source = roomsById.get(connection.fromRoomId);
      const target = roomsById.get(connection.toRoomId);
      if (source?.exitId !== connection.exitId)
        context.addIssue({
          code: "custom",
          path: ["connections", index, "exitId"],
          message: `${connection.id}: sortie absente de la salle source`,
        });
      if (target?.entryId !== connection.targetEntryId)
        context.addIssue({
          code: "custom",
          path: ["connections", index, "targetEntryId"],
          message: `${connection.id}: entrée absente de la salle cible`,
        });
    }
  });

export type ExpeditionRoomDefinition = z.infer<
  typeof expeditionRoomDefinitionSchema
>;
export type RoomConnectionDefinition = z.infer<
  typeof roomConnectionDefinitionSchema
>;
export type ExpeditionDefinition = z.infer<typeof expeditionDefinitionSchema>;

export function parseExpeditionDefinition(value: unknown): ExpeditionDefinition {
  return expeditionDefinitionSchema.parse(value);
}
