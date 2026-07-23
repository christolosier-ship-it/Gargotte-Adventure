import { expect, test } from "@playwright/test";
import {
  bringPointIntoViewport,
  canvasLocator,
  canvasPointForLogicalCell,
  combatantAssetStatus,
  enterRoom,
  moveBrunhilda,
  tapOrClick,
} from "./helpers/canvas";

const goblinInitialId = "gobelin-bricoleur-initial-1";

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

  await enterRoom(page);
  const canvas = canvasLocator(page);
  await expect
    .poll(async () =>
      canvas.evaluate((element) => element.dataset.assetManifest),
    )
    .toBe("loaded");
  await expect.poll(() => requestWasBlocked).toBe(true);
  await expect.poll(() => assetErrors.length).toBeGreaterThan(0);
  await expect(canvas).toBeVisible();
  await moveBrunhilda(page, isMobile);
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

  await enterRoom(page);
  await expect.poll(() => combatantAssetStatus(page, "brunhilda")).toBe("webp");
  await expect
    .poll(() => combatantAssetStatus(page, goblinInitialId))
    .toBe("webp");
  expect(pageErrors).toEqual([]);

  expect(
    await page.request.get("./assets/isometric/characters/brunhilda.webp"),
  ).toBeOK();
  expect(
    await page.request.get(
      "./assets/isometric/characters/gobelin-bricoleur.webp",
    ),
  ).toBeOK();
});

test("sélectionne Brünhilda en touchant directement sa silhouette WebP", async ({
  page,
  isMobile,
}) => {
  await enterRoom(page);
  await expect.poll(() => combatantAssetStatus(page, "brunhilda")).toBe("webp");

  const point = await bringPointIntoViewport(page, () =>
    canvasPointForLogicalCell(page, { column: 0, row: 0 }, { x: 0, y: -48 }),
  );
  await tapOrClick(page, isMobile, point);
  await expect
    .poll(async () => canvasLocator(page).getAttribute("data-active-hero"))
    .toBe("brunhilda");
});

for (const pilot of [
  {
    combatantId: "brunhilda",
    file: "brunhilda.webp",
    otherCombatantId: goblinInitialId,
  },
  {
    combatantId: goblinInitialId,
    file: "gobelin-bricoleur.webp",
    otherCombatantId: "brunhilda",
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

    await enterRoom(page);
    await expect
      .poll(() => combatantAssetStatus(page, pilot.combatantId))
      .toBe("texture-error");
    await expect
      .poll(() => combatantAssetStatus(page, pilot.otherCombatantId))
      .toBe("webp");
    await expect(canvasLocator(page)).toBeVisible();
    await moveBrunhilda(page, isMobile);
    expect(pageErrors).toEqual([]);
  });
}
