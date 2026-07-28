import { expect, test } from "@playwright/test";
import {
  combatantAssetStatus,
  enterRoom,
  readCanvasState,
} from "./helpers/canvas";

const initialRequestId = "population-vestibule";
const firstInstanceId = "gobelin-bricoleur-spawn-1";
const secondInstanceId = "gobelin-bricoleur-spawn-2";

test("instancie et restaure la population initiale sans replay", async ({
  page,
}) => {
  await enterRoom(page);

  const initial = await readCanvasState(page);
  expect(initial.enemies).toHaveLength(2);
  expect(initial.spawnPoints.map((point) => point.id)).toEqual([
    "initial-vestibule-haut",
    "initial-vestibule-bas",
    "renfort-vestibule-haut",
    "renfort-vestibule-bas",
  ]);
  expect(initial.processedSpawnRequests).toEqual([initialRequestId]);
  expect(initial.nextEnemyInstanceSequence).toBe(3);
  expect(initial.enemies).toMatchObject([
    {
      id: firstInstanceId,
      creatureId: "gobelin-bricoleur",
      position: { column: 7, row: 0 },
      hp: 6,
      alive: true,
    },
    {
      id: secondInstanceId,
      creatureId: "gobelin-bricoleur",
      position: { column: 7, row: 3 },
      hp: 6,
      alive: true,
    },
  ]);
  await expect
    .poll(() => combatantAssetStatus(page, firstInstanceId))
    .toBe("webp");

  await page.reload();
  const resume = page.getByRole("button", { name: "Reprendre l’expédition" });
  await expect(resume).toBeEnabled();
  await resume.click();

  const restored = await readCanvasState(page);
  expect(restored.enemies).toEqual(initial.enemies);
  expect(restored.processedSpawnRequests).toEqual([initialRequestId]);
  expect(restored.nextEnemyInstanceSequence).toBe(3);
});
