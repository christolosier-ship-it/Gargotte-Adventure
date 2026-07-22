import { expect, test, type Page } from "@playwright/test";

type CameraRotation = 0 | 90 | 180 | 270;

type CanvasScene = {
  rotation: CameraRotation;
  visibleWalls: string[];
  wallSegments: {
    id: string;
    side: string;
    index: number;
    position: { column: number; row: number };
    viewPosition: { column: number; row: number };
    viewSide: string;
    orientation: string;
  }[];
  heroes: {
    id: string;
    position: { column: number; row: number };
    viewPosition: { column: number; row: number };
    actionsRemaining: number;
  }[];
};

const canvasLocator = (page: Page) =>
  page.getByRole("img", { name: /Plateau tactique PixiJS/i });

const readScene = async (page: Page): Promise<CanvasScene> =>
  canvasLocator(page).evaluate((element) => ({
    rotation: Number(element.dataset.viewRotation) as CameraRotation,
    visibleWalls: JSON.parse(element.dataset.visibleWalls ?? "[]") as string[],
    wallSegments: JSON.parse(
      element.dataset.wallSegments ?? "[]",
    ) as CanvasScene["wallSegments"],
    heroes: JSON.parse(element.dataset.heroes ?? "[]") as CanvasScene["heroes"],
  }));

const pointForLogicalCell = async (
  page: Page,
  position: { column: number; row: number },
) =>
  canvasLocator(page).evaluate((element, logicalPosition) => {
    const projection = JSON.parse(element.dataset.projection ?? "{}");
    const camera = JSON.parse(element.dataset.camera ?? "{}");
    const dimensions = JSON.parse(element.dataset.roomDimensions ?? "{}");
    const rotation = Number(element.dataset.viewRotation) as CameraRotation;
    const rect = element.getBoundingClientRect();
    const viewed =
      rotation === 90
        ? {
            column: logicalPosition.row,
            row: dimensions.width - 1 - logicalPosition.column,
          }
        : rotation === 180
          ? {
              column: dimensions.width - 1 - logicalPosition.column,
              row: dimensions.height - 1 - logicalPosition.row,
            }
          : rotation === 270
            ? {
                column: dimensions.height - 1 - logicalPosition.row,
                row: logicalPosition.column,
              }
            : logicalPosition;
    const localX =
      projection.originX +
      ((viewed.column - viewed.row) * projection.tileWidth) / 2;
    const localY =
      projection.originY +
      ((viewed.column + viewed.row) * projection.tileHeight) / 2;
    return {
      x: rect.left + camera.offsetX + localX * camera.scale,
      y: rect.top + camera.offsetY + localY * camera.scale,
    };
  }, position);

const expectBrunhildaAt = async (
  page: Page,
  position: { column: number; row: number },
  actions: number,
) => {
  await expect
    .poll(async () => {
      const hero = (await readScene(page)).heroes.find(
        (candidate) => candidate.id === "brunhilda",
      );
      return { position: hero?.position, actions: hero?.actionsRemaining };
    })
    .toEqual({ position, actions });
};

test("n'affiche que les deux murs arrière pendant quatre rotations", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  const canvas = canvasLocator(page);
  await expect(canvas).toBeVisible();

  const initialHeroes = (await readScene(page)).heroes.map((hero) => ({
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
    const scene = await readScene(page);
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
  await expect.poll(async () => (await readScene(page)).rotation).toBe(0);
  await expect(page.getByText("Vue : 0°")).toBeVisible();
});

test("conserve le picking logique après une rotation de 90°", async ({
  page,
  isMobile,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  await page
    .getByRole("button", { name: "Activer Brünhilda la Torgnole" })
    .click();
  await page.getByRole("button", { name: /Pivoter la caméra de 90°/ }).click();
  await expect.poll(async () => (await readScene(page)).rotation).toBe(90);

  const target = { column: 1, row: 0 };
  const point = await pointForLogicalCell(page, target);
  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);

  await expectBrunhildaAt(page, target, 2);
});

test("réinitialise la caméra sans modifier la salle sauvegardée", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  await page.getByRole("button", { name: /Pivoter la caméra de 90°/ }).click();
  await expect.poll(async () => (await readScene(page)).rotation).toBe(90);
  const beforeReload = (await readScene(page)).heroes.map((hero) => ({
    id: hero.id,
    position: hero.position,
  }));

  await page.reload();
  await page.getByRole("button", { name: "Reprendre" }).click();
  const restored = await readScene(page);
  expect(restored.rotation).toBe(0);
  expect(
    restored.heroes.map((hero) => ({ id: hero.id, position: hero.position })),
  ).toEqual(beforeReload);
});
