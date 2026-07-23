import { expect, test } from "@playwright/test";
import { enterRoom, readCanvasState } from "./helpers/canvas";

const explosionButtonName = /Explosion · \+2/;
const calmButtonName = /Tour calme · −2/;

test("fait évoluer, explique et restaure le Brouhaha", async ({ page }) => {
  await enterRoom(page);

  const initial = await readCanvasState(page);
  expect(initial.brouhahaLevel).toBe(0);
  expect(initial.brouhahaHistory).toEqual([]);
  expect(initial.processedBrouhahaRequests).toEqual([]);
  expect(initial.nextBrouhahaResolutionSequence).toBe(1);
  await expect(page.getByText("Brouhaha 0/12", { exact: true })).toBeVisible();

  const explosion = page.getByRole("button", { name: explosionButtonName });
  for (const expectedLevel of [2, 4, 6, 8, 10]) {
    await explosion.click();
    await expect
      .poll(async () => (await readCanvasState(page)).brouhahaLevel)
      .toBe(expectedLevel);
  }

  const noisy = await readCanvasState(page);
  expect(noisy.brouhahaHistory).toHaveLength(5);
  expect(noisy.processedBrouhahaRequests).toHaveLength(5);
  expect(noisy.nextBrouhahaResolutionSequence).toBe(6);
  expect(noisy.brouhahaHistory.at(-1)).toMatchObject({
    previousLevel: 8,
    level: 10,
    requestedDelta: 2,
    appliedDelta: 2,
  });
  expect(noisy.brouhahaHistory.at(-1)?.effectIds).toHaveLength(2);
  expect(new Set(noisy.brouhahaHistory.at(-1)?.effectIds).size).toBe(2);
  await expect(page.getByText("Brouhaha 10/12", { exact: true })).toBeVisible();
  await expect(page.getByText(/Effets:/)).toBeVisible();

  await page.getByRole("button", { name: calmButtonName }).click();
  await expect
    .poll(async () => (await readCanvasState(page)).brouhahaLevel)
    .toBe(8);
  const calmed = await readCanvasState(page);
  expect(calmed.brouhahaHistory.at(-1)).toMatchObject({
    previousLevel: 10,
    level: 8,
    requestedDelta: -2,
    appliedDelta: -2,
  });
  expect(calmed.brouhahaHistory.at(-1)?.effectIds).toHaveLength(1);

  await page.reload();
  await expect
    .poll(async () => (await readCanvasState(page)).brouhahaLevel)
    .toBe(8);
  const restored = await readCanvasState(page);
  expect(restored.brouhahaHistory).toEqual(calmed.brouhahaHistory);
  expect(restored.processedBrouhahaRequests).toEqual(
    calmed.processedBrouhahaRequests,
  );
  expect(restored.nextBrouhahaResolutionSequence).toBe(7);
  await expect(page.getByText("Brouhaha 8/12", { exact: true })).toBeVisible();
});
