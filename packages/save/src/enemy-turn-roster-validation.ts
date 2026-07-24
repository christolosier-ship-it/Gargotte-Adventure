import { z } from "zod";

export function validateEnemyTurnRoster(
  room: {
    enemies: { id: string }[];
    phase: "heroes-turn" | "enemy-turn" | "victory" | "defeat";
    enemyTurnRoster?: string[];
  },
  context: z.RefinementCtx,
): void {
  const roster = room.enemyTurnRoster ?? [];
  if (new Set(roster).size !== roster.length)
    context.addIssue({
      code: "custom",
      path: ["enemyTurnRoster"],
      message:
        "le roster du tour ennemi doit contenir des identifiants uniques",
    });

  const enemyIds = new Set(room.enemies.map((enemy) => enemy.id));
  for (const enemyId of roster)
    if (!enemyIds.has(enemyId))
      context.addIssue({
        code: "custom",
        path: ["enemyTurnRoster"],
        message: `ennemi absent du roster persistant: ${enemyId}`,
      });

  if (room.phase !== "enemy-turn" && roster.length > 0)
    context.addIssue({
      code: "custom",
      path: ["enemyTurnRoster"],
      message: "le roster doit être vide hors de la phase enemy-turn",
    });

  const sorted = [...roster].sort((a, b) => a.localeCompare(b));
  if (roster.some((enemyId, index) => enemyId !== sorted[index]))
    context.addIssue({
      code: "custom",
      path: ["enemyTurnRoster"],
      message: "le roster du tour ennemi doit être trié",
    });
}
