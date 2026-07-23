import { expect, test } from "@playwright/test";
import {
  combatantAssetStatus,
  enterRoom,
  readCanvasState,
} from "./helpers/canvas";

const scriptedSpawnLabel = "Faire entrer un renfort de contrôle";
const requestId = "renfort-controle-sprint-3-1";
const spawnedInstanceId = "gobelin-bricoleur-spawn-1";

test("instancie et restaure un renfort déterministe", async ({ page }) => {
  await enterRoom(page);

  const initial = await readCanvasState(page);
  expect(initial.enemies).toHaveLength(2);
  expect(initial.spawnPoints.map((point) => point.id)).toEqual([
    "renfort-est-haut",
    "renfort-est-bas",
  ]);
  expect(initial.processedSpawnRequests).toEqual([]);
  expect(initial.nextEnemyInstanceSequence).toBe(1);

  const spawnButton = page.getByRole("button", {
    name: new RegExp(scriptedSpawnLabel, "i"),
  });
  await expect(spawnButton).toBeVisible();
  await spawnButton.click();

  await expect
    .poll(async () => (await readCanvasState(page)).enemies.length)
    .toBe(3);
  const spawned = await readCanvasState(page);
  expect(spawned.enemies.at(-1)).toMatchObject({
    id: spawnedInstanceId,
    creatureId: "gobelin-bricoleur",
    position: { column: 6, row: 0 },
    hp: 6,
    alive: true,
  });
  expect(spawned.processedSpawnRequests).toEqual([requestId]);
  expect(spawned.nextEnemyInstanceSequence).toBe(2);
  await expect(spawnButton).toHaveCount(0);
  await expect
    .poll(() => combatantAssetStatus(page, spawnedInstanceId))
    .toBe("webp");

  await page.reload();
  await expect
    .poll(async () => (await readCanvasState(page)).enemies.length)
    .toBe(3);
  const restored = await readCanvasState(page);
  expect(restored.enemies.at(-1)).toEqual(spawned.enemies.at(-1));
  expect(restored.processedSpawnRequests).toEqual([requestId]);
  expect(restored.nextEnemyInstanceSequence).toBe(2);
  await expect(
    page.getByRole("button", {
      name: new RegExp(scriptedSpawnLabel, "i"),
    }),
  ).toHaveCount(0);
});
