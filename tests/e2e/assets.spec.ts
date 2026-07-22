import { expect, test, type Page } from "@playwright/test";

type ScreenPoint = { x: number; y: number };

const canvasPointForCell = async (
  page: Page,
  position: { column: number; row: number },
  nudge: { x: number; y: number } = { x: 0, y: 0 },
): Promise<ScreenPoint> => {
  const canvas = page.getByRole("img", {
    name: /Plateau tactique PixiJS/i,
  });
  return canvas.evaluate(
    (element, { position: target, nudge: offset }) => {
      const projection = JSON.parse(element.dataset.projection ?? "{}");
      const camera = JSON.parse(element.dataset.camera ?? "{}");
      const rect = element.getBoundingClientRect();
      const localX =
        projection.originX +
        ((target.column - target.row) * projection.tileWidth) / 2 +
        offset.x;
      const localY =
        projection.originY +
        ((target.column + target.row) * projection.tileHeight) / 2 +
        offset.y;
      return {
        x: rect.left + camera.offsetX + localX * camera.scale,
        y: rect.top + camera.offsetY + localY * camera.scale,
      };
    },
    { position, nudge },
  );
};

const bringPointIntoViewport = async (
  page: Page,
  resolvePoint: () => Promise<ScreenPoint>,
): Promise<ScreenPoint> => {
  const viewport = page.viewportSize();
  if (!viewport) return resolvePoint();
  const margin = 48;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const point = await resolvePoint();
    const deltaY =
      point.y < margin
        ? point.y - margin
        : point.y > viewport.height - margin
          ? point.y - (viewport.height - margin)
          : 0;
    if (Math.abs(deltaY) < 1) return point;
    await page.evaluate((offset) => window.scrollBy(0, offset), deltaY);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
  }
  const point = await resolvePoint();
  expect(point.y).toBeGreaterThanOrEqual(margin);
  expect(point.y).toBeLessThanOrEqual(viewport.height - margin);
  return point;
};

const combatantAssetStatus = async (page: Page, combatantId: string) => {
  const canvas = page.getByRole("img", {
    name: /Plateau tactique PixiJS/i,
  });
  return canvas.evaluate(
    (element, id) => element.getAttribute(`data-asset-${id}`),
    combatantId,
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

test("reste jouable lorsqu’une texture technique manque réellement", async ({
  page,
  isMobile,
}) => {
  let requestWasBlocked = false;
  const assetErrors: string[] = [];

  await page.route("**/assets/isometric/fx/impact-test.svg", async (route) => {
    requestWasBlocked = true;
    await route.abort("failed");
  });
  page.on("console", (message) => {
    if (message.text().includes("[assets] texture échouée"))
      assetErrors.push(message.text());
  });

  await page.goto("./");
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  const canvas = page.getByRole("img", {
    name: /Plateau tactique PixiJS/i,
  });

  await expect
    .poll(async () =>
      canvas.evaluate((element) => element.dataset.assetManifest),
    )
    .toBe("loaded");
  await expect.poll(() => requestWasBlocked).toBe(true);
  await expect.poll(() => assetErrors.length).toBeGreaterThan(0);
  await expect(canvas).toBeVisible();

  await page
    .getByRole("button", { name: "Activer Brünhilda la Torgnole" })
    .click();
  const target = { column: 1, row: 0 };
  const point = await bringPointIntoViewport(page, () =>
    canvasPointForCell(page, target),
  );

  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);

  await expectBrunhildaMoved(page);
});

test("charge les sprites pilotes après un manifeste volontairement retardé", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/assets/isometric/manifest.json", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.continue();
  });

  await page.goto("./");
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();

  await expect.poll(() => combatantAssetStatus(page, "brunhilda")).toBe("webp");
  await expect
    .poll(() => combatantAssetStatus(page, "gobelin-bricoleur"))
    .toBe("webp");
  expect(pageErrors).toEqual([]);

  const brunhildaResponse = await page.request.get(
    "./assets/isometric/characters/brunhilda.webp",
  );
  const gobelinResponse = await page.request.get(
    "./assets/isometric/characters/gobelin-bricoleur.webp",
  );
  expect(brunhildaResponse).toBeOK();
  expect(gobelinResponse).toBeOK();
});

test("sélectionne Brünhilda en touchant directement sa silhouette WebP", async ({
  page,
  isMobile,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  const canvas = page.getByRole("img", {
    name: /Plateau tactique PixiJS/i,
  });
  await expect.poll(() => combatantAssetStatus(page, "brunhilda")).toBe("webp");

  const point = await bringPointIntoViewport(page, () =>
    canvasPointForCell(page, { column: 0, row: 0 }, { x: 0, y: -48 }),
  );
  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);

  await expect
    .poll(async () =>
      canvas.evaluate((element) => element.dataset.activeHero ?? ""),
    )
    .toBe("brunhilda");
});

for (const pilot of [
  {
    id: "brunhilda",
    file: "brunhilda.webp",
    otherId: "gobelin-bricoleur",
  },
  {
    id: "gobelin-bricoleur",
    file: "gobelin-bricoleur.webp",
    otherId: "brunhilda",
  },
] as const) {
  test(`conserve les placeholders et le picking si ${pilot.file} échoue`, async ({
    page,
    isMobile,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route(
      `**/assets/isometric/characters/${pilot.file}`,
      async (route) => route.abort("failed"),
    );

    await page.goto("./");
    await page.getByRole("button", { name: "Entrer dans la salle" }).click();
    const canvas = page.getByRole("img", {
      name: /Plateau tactique PixiJS/i,
    });

    await expect
      .poll(() => combatantAssetStatus(page, pilot.id))
      .toBe("texture-error");
    await expect
      .poll(() => combatantAssetStatus(page, pilot.otherId))
      .toBe("webp");
    await expect(canvas).toBeVisible();

    await page
      .getByRole("button", { name: "Activer Brünhilda la Torgnole" })
      .click();
    const target = { column: 1, row: 0 };
    const point = await bringPointIntoViewport(page, () =>
      canvasPointForCell(page, target),
    );
    if (isMobile) await page.touchscreen.tap(point.x, point.y);
    else await page.mouse.click(point.x, point.y);

    await expectBrunhildaMoved(page);
    expect(pageErrors).toEqual([]);
  });
}
