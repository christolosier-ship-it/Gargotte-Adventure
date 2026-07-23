import { z } from "zod";

const idSchema = z.string().min(1);

const brouhahaSourceSchema = z
  .object({
    type: z.enum([
      "combat",
      "object",
      "explosion",
      "door",
      "ability",
      "calm-turn",
      "scenario",
      "test",
    ]),
    id: idSchema,
  })
  .strict();

const brouhahaHistoryEntrySchema = z
  .object({
    id: idSchema,
    requestId: idSchema,
    sequence: z.number().int().positive(),
    previousLevel: z.number().int().min(0).max(12),
    level: z.number().int().min(0).max(12),
    requestedDelta: z.number().int(),
    appliedDelta: z.number().int(),
    source: brouhahaSourceSchema,
    reason: z.string().min(1),
    effectIds: z.array(idSchema).min(1).max(2),
  })
  .strict()
  .superRefine((entry, context) => {
    if (entry.requestedDelta === 0)
      context.addIssue({
        code: "custom",
        path: ["requestedDelta"],
        message: "requestedDelta doit être non nul",
      });
    if (entry.appliedDelta !== entry.level - entry.previousLevel)
      context.addIssue({
        code: "custom",
        path: ["appliedDelta"],
        message: "appliedDelta doit correspondre au changement de niveau",
      });
    if (new Set(entry.effectIds).size !== entry.effectIds.length)
      context.addIssue({
        code: "custom",
        path: ["effectIds"],
        message: "les effets résolus doivent être distincts",
      });
    const expectedEffectCount = entry.level >= 10 ? 2 : 1;
    if (entry.effectIds.length !== expectedEffectCount)
      context.addIssue({
        code: "custom",
        path: ["effectIds"],
        message: `${expectedEffectCount} effet(s) attendu(s) au niveau ${entry.level}`,
      });
  });

export const brouhahaStateSchema = z
  .object({
    level: z.number().int().min(0).max(12),
    processedRequestIds: z.array(idSchema),
    nextResolutionSequence: z.number().int().positive(),
    history: z.array(brouhahaHistoryEntrySchema),
  })
  .strict()
  .superRefine((brouhaha, context) => {
    if (
      new Set(brouhaha.processedRequestIds).size !==
      brouhaha.processedRequestIds.length
    )
      context.addIssue({
        code: "custom",
        path: ["processedRequestIds"],
        message: "les demandes de Brouhaha traitées doivent être uniques",
      });

    const historyIds = new Set<string>();
    const historyRequests = new Set<string>();
    const sequences = new Set<number>();
    for (const entry of brouhaha.history) {
      if (historyIds.has(entry.id))
        context.addIssue({
          code: "custom",
          path: ["history"],
          message: `historique de Brouhaha dupliqué ${entry.id}`,
        });
      historyIds.add(entry.id);
      if (historyRequests.has(entry.requestId))
        context.addIssue({
          code: "custom",
          path: ["history"],
          message: `demande de Brouhaha dupliquée ${entry.requestId}`,
        });
      historyRequests.add(entry.requestId);
      if (sequences.has(entry.sequence))
        context.addIssue({
          code: "custom",
          path: ["history"],
          message: `séquence de Brouhaha dupliquée ${entry.sequence}`,
        });
      sequences.add(entry.sequence);
      if (!brouhaha.processedRequestIds.includes(entry.requestId))
        context.addIssue({
          code: "custom",
          path: ["processedRequestIds"],
          message: `demande historique absente des demandes traitées: ${entry.requestId}`,
        });
    }

    const last = brouhaha.history.at(-1);
    if (last && last.level !== brouhaha.level)
      context.addIssue({
        code: "custom",
        path: ["level"],
        message: "le niveau doit correspondre à la dernière résolution",
      });
    const maxSequence = Math.max(
      0,
      ...brouhaha.history.map((entry) => entry.sequence),
    );
    if (brouhaha.nextResolutionSequence <= maxSequence)
      context.addIssue({
        code: "custom",
        path: ["nextResolutionSequence"],
        message: "la prochaine séquence doit suivre l'historique",
      });
  });
