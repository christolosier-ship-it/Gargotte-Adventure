import { expect, test, type Page } from "@playwright/test";

const canvasPointForCell = async (
  page: Page,
  position: { column: number; row: number },
) => {
  const canvas = page.getByRole("img", {
    name: /Plateau tactique PixiJS/i,
  });
  return canvas.evaluate((element, target) => {
    const projection = JSON.parse(element.dataset.projection ?? "{}");
    const camera = JSON.parse(element.dataset.camera ?? "{}");
    const rect = element.getBoundingClientRect();
    const localX =
      projection.originX +
      ((target.column - target.row) * projection.tileWidth) / 2;
    const localY =
      projection.originY +
      ((target.column + target.row) * projection.tileHeight) / 2;
    return {
      x: rect.left + camera.offsetX + localX * camera.scale,
      y: rect.top + camera.offsetY + localY * camera.scale,
    };
  }, position);
};

const environmentStatus = async (page: Page, key: string) => {
  const canvas = page.getByRole("img", {
    name: /Plateau tactique PixiJS/i,
  });
  return canvas.evaluate(
    (element, statusKey) =>
      element.getAttribute(`data-asset-environment-${statusKey}`),
    key,
  );
};

const expectBrunhildaMoved = async (page: Page) => {
  const canvas = page.getByRole("img", {
    name: /Plateau tactique PixiJS/i,
  });
  await expect
    .poll(async () =>
      canvas.evaluate((element) => {
        const heroes = JSON.parse(element.dataset.heroes ?? "[]");
        const brunhilda = heroes.find(
          (hero: { id: string }) => hero.id === "brunhilda",
        );
        return {
          position: brunhilda?.position,
          actionsRemaining: brunhilda?.actionsRemaining,
        };
      }),
    )
    .toEqual({
      position: { column: 1, row: 0 },
      actionsRemaining: 2,
    });
};

const enterRoom = async (page: Page) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
};

const moveBrunhilda = async (page: Page, isMobile: boolean) => {
  await page
    .getByRole("button", { name: "Activer Brünhilda la Torgnole" })
    .click();
  const point = await canvasPointForCell(page, { column: 1, row: 0 });
  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  await expectBrunhildaMoved(page);
};

test("charge l’environnement Bastognac et conserve le picking canvas", async ({
  page,
  isMobile,
}) => {
  await enterRoom(page);
  for (const key of [
    "tile-bastognac-floor-a",
    "tile-bastognac-floor-b",
    "wall-bastognac-south-east",
    "wall-bastognac-north-east",
    "prop-bastognac-barrel",
  ])
    await expect.poll(() => environmentStatus(page, key)).toBe("svg");

  for (const path of [
    "./assets/isometric/tiles/bastognac-floor-a.svg",
    "./assets/isometric/tiles/bastognac-floor-b.svg",
    "./assets/isometric/walls/bastognac-wall-se.svg",
    "./assets/isometric/walls/bastognac-wall-ne.svg",
    "./assets/isometric/props/bastognac-barrel.svg",
  ])
    expect(await page.request.get(path)).toBeOK();

  await moveBrunhilda(page, isMobile);
});

for (const failure of [
  {
    path: "**/assets/isometric/tiles/bastognac-floor-a.svg",
    key: "tile-bastognac-floor-a",
  },
  {
    path: "**/assets/isometric/walls/bastognac-wall-se.svg",
    key: "wall-bastognac-south-east",
  },
  {
    path: "**/assets/isometric/props/bastognac-barrel.svg",
    key: "prop-bastognac-barrel",
  },
] as const) {
  test(`reste jouable si ${failure.key} échoue`, async ({ page, isMobile }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route(failure.path, async (route) => route.abort("failed"));

    await enterRoom(page);
    await expect
      .poll(() => environmentStatus(page, failure.key))
      .toBe("texture-error");
    await expect(
      page.getByRole("img", { name: /Plateau tactique PixiJS/i }),
    ).toBeVisible();
    await moveBrunhilda(page, isMobile);
    expect(pageErrors).toEqual([]);
  });
}
