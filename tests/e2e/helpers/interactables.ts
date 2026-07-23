import type { Page } from "@playwright/test";
import { canvasLocator, type GridPosition } from "./canvas";

export interface CanvasInteractableState {
  id: string;
  interactableId: string;
  kind: string;
  position: GridPosition;
  viewPosition: GridPosition;
  stateId: string;
  blocksMovement: boolean;
  blocksLineOfSight: boolean;
}

export async function readInteractables(
  page: Page,
): Promise<CanvasInteractableState[]> {
  return canvasLocator(page).evaluate(
    (element) =>
      JSON.parse(
        element.dataset.interactables ?? "[]",
      ) as CanvasInteractableState[],
  );
}

export async function readProcessedInteractableRequests(
  page: Page,
): Promise<string[]> {
  return canvasLocator(page).evaluate(
    (element) =>
      JSON.parse(
        element.dataset.processedInteractableRequests ?? "[]",
      ) as string[],
  );
}

export async function readNextInteractableSequence(
  page: Page,
): Promise<number> {
  return canvasLocator(page).evaluate((element) =>
    Number(element.dataset.nextInteractableInteractionSequence ?? 0),
  );
}
