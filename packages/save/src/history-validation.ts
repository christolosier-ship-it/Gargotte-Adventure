import { z } from "zod";

export function validateSequencedHistory(
  history: readonly { id: string; sequence: number }[],
  nextSequence: number | undefined,
  path: string,
  label: string,
  context: z.RefinementCtx,
): void {
  const ids = new Set(history.map((entry) => entry.id));
  const sequences = new Set(history.map((entry) => entry.sequence));
  if (ids.size !== history.length || sequences.size !== history.length)
    context.addIssue({
      code: "custom",
      path: [path],
      message: `${label} doit avoir des identifiants et séquences uniques`,
    });
  const maximum = Math.max(0, ...history.map((entry) => entry.sequence));
  if (nextSequence !== undefined && nextSequence <= maximum)
    context.addIssue({
      code: "custom",
      path: [path.replace("History", "Sequence")],
      message: `la prochaine séquence doit suivre ${label}`,
    });
}
