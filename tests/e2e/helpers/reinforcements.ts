import type { Page } from "@playwright/test";
import { canvasLocator } from "./canvas";

export interface ReinforcementHistoryEntry {
  id: string;
  sequence: number;
  reinforcementDefinitionId: string;
  brouhahaRequestId: string;
  threshold: number;
  activation: number;
  spawnRequestId: string;
  result: "succeeded" | "partial" | "rejected";
  createdInstanceIds: string[];
  details: string[];
}

export async function readReinforcementHistory(
  page: Page,
): Promise<ReinforcementHistoryEntry[]> {
  return canvasLocator(page).evaluate(
    (element) =>
      JSON.parse(
        element.dataset.brouhahaReinforcementHistory ?? "[]",
      ) as ReinforcementHistoryEntry[],
  );
}

export async function readNextReinforcementSequence(
  page: Page,
): Promise<number> {
  return canvasLocator(page).evaluate((element) =>
    Number(element.dataset.nextBrouhahaReinforcementSequence ?? 0),
  );
}
