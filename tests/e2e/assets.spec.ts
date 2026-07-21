import { expect, test } from "@playwright/test";

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
  const point = await canvas.evaluate((element) => {
    const projection = JSON.parse(element.dataset.projection ?? "{}");
    const camera = JSON.parse(element.dataset.camera ?? "{}");
    const rect = element.getBoundingClientRect();
    const column = 1;
    const row = 0;
    const localX =
      projection.originX +
      ((column - row) * projection.tileWidth) / 2;
    const localY =
      projection.originY +
      ((column + row) * projection.tileHeight) / 2;
    return {
      x: rect.left + camera.offsetX + localX * camera.scale,
      y: rect.top + camera.offsetY + localY * camera.scale,
    };
  });

  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);

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
});
