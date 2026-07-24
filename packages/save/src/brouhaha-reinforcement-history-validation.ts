import { z } from "zod";
import { brouhahaReinforcementHistoryEntrySchema } from "./brouhaha-reinforcement-schema";
import { validateSequencedHistory } from "./history-validation";

export function validateReinforcementHistory(
  room: {
    nextBrouhahaReinforcementSequence?: number;
    brouhahaReinforcementHistory?: z.infer<
      typeof brouhahaReinforcementHistoryEntrySchema
    >[];
  },
  context: z.RefinementCtx,
): void {
  const history = room.brouhahaReinforcementHistory ?? [];
  validateSequencedHistory(
    history,
    room.nextBrouhahaReinforcementSequence,
    "brouhahaReinforcementHistory",
    "nextBrouhahaReinforcementSequence",
    "l'historique des renforts",
    context,
  );
  const activations = new Set(
    history.map(
      (entry) => `${entry.reinforcementDefinitionId}:${entry.activation}`,
    ),
  );
  const requests = new Set(history.map((entry) => entry.spawnRequestId));
  if (activations.size !== history.length || requests.size !== history.length)
    context.addIssue({
      code: "custom",
      path: ["brouhahaReinforcementHistory"],
      message: "les activations et demandes de renfort doivent être uniques",
    });
}
