import { expect, test } from "@playwright/test";
import {
  activateBrunhilda,
  bringPointIntoViewport,
  canvasLocator,
  canvasPointForLogicalCell,
  enterRoom,
  expectHeroAt,
  readCanvasState,
  tapOrClick,
  type CameraRotation,
} from "./helpers/canvas";

test("n'affiche que les deux murs arrière pendant quatre rotations", async ({
  page,
}) => {
  await enterRoom(page);
  const canvas = canvasLocator(page);
  await expect(canvas).toBeVisible();

  const initialHeroes = (await readCanvasState(page)).heroes.map((hero) => ({
    id: hero.id,
    position: hero.position,
  }));
  const expectedViews: readonly {
    rotation: CameraRotation;
    walls: readonly string[];
  }[] = [
    { rotation: 0, walls: ["north", "west"] },
    { rotation: 90, walls: ["north", "east"] },
    { rotation: 180, walls: ["south", "east"] },
    { rotation: 270, walls: ["south", "west"] },
  ];

  for (const [index, expectedView] of expectedViews.entries()) {
    const scene = await readCanvasState(page);
    expect(scene.rotation).toBe(expectedView.rotation);
    expect(scene.visibleWalls).toEqual(expectedView.walls);
    expect(scene.wallSegments).toHaveLength(12);
    expect(new Set(scene.wallSegments.map((wall) => wall.id)).size).toBe(12);
    expect(
      [...new Set(scene.wallSegments.map((wall) => wall.side))].sort(),
    ).toEqual([...expectedView.walls].sort());
    expect(
      scene.wallSegments.every(
        (wall) => wall.viewSide === "north" || wall.viewSide === "west",
      ),
    ).toBe(true);
    expect(
      scene.heroes.map((hero) => ({ id: hero.id, position: hero.position })),
    ).toEqual(initialHeroes);
    await expect(canvas).toBeInViewport();

    if (index < expectedViews.length - 1)
      await page
        .getByRole("button", { name: /Pivoter la caméra de 90°/ })
        .click();
  }

  await page.getByRole("button", { name: /Pivoter la caméra de 90°/ }).click();
  await expect.poll(async () => (await readCanvasState(page)).rotation).toBe(0);
  await expect(page.getByText("Vue : 0°")).toBeVisible();
});

test("conserve le picking logique après une rotation de 90°", async ({
  page,
  isMobile,
}) => {
  await enterRoom(page);
  await activateBrunhilda(page);
  await page.getByRole("button", { name: /Pivoter la caméra de 90°/ }).click();
  await expect
    .poll(async () => (await readCanvasState(page)).rotation)
    .toBe(90);

  const target = { column: 1, row: 0 };
  const point = await bringPointIntoViewport(page, () =>
    canvasPointForLogicalCell(page, target, { x: 0, y: -16 }),
  );
  await tapOrClick(page, isMobile, point);
  await expectHeroAt(page, "brunhilda", target, 2);
});

test("réinitialise la caméra sans modifier la salle sauvegardée", async ({
  page,
}) => {
  await enterRoom(page);
  await page.getByRole("button", { name: /Pivoter la caméra de 90°/ }).click();
  await expect
    .poll(async () => (await readCanvasState(page)).rotation)
    .toBe(90);
  const beforeReload = (await readCanvasState(page)).heroes.map((hero) => ({
    id: hero.id,
    position: hero.position,
  }));

  await page.reload();
  await page.getByRole("button", { name: "Reprendre" }).click();
  const restored = await readCanvasState(page);
  expect(restored.rotation).toBe(0);
  expect(
    restored.heroes.map((hero) => ({ id: hero.id, position: hero.position })),
  ).toEqual(beforeReload);
});
