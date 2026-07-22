import { expect, test } from "@playwright/test";
import {
  canvasLocator,
  enterRoom,
  environmentAssetStatus,
  moveBrunhilda,
} from "./helpers/canvas";

const environmentKeys = [
  "tile-bastognac-floor-a",
  "tile-bastognac-floor-b",
  "wall-bastognac-south-east",
  "wall-bastognac-north-east",
  "prop-bastognac-barrel",
] as const;

const environmentPaths = [
  "./assets/isometric/tiles/bastognac-floor-a.svg",
  "./assets/isometric/tiles/bastognac-floor-b.svg",
  "./assets/isometric/walls/bastognac-wall-se.svg",
  "./assets/isometric/walls/bastognac-wall-ne.svg",
  "./assets/isometric/props/bastognac-barrel.svg",
] as const;

test("charge l’environnement Bastognac et conserve le picking canvas", async ({
  page,
  isMobile,
}) => {
  await enterRoom(page);
  for (const key of environmentKeys)
    await expect.poll(() => environmentAssetStatus(page, key)).toBe("svg");

  for (const path of environmentPaths)
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
      .poll(() => environmentAssetStatus(page, failure.key))
      .toBe("texture-error");
    await expect(canvasLocator(page)).toBeVisible();
    await moveBrunhilda(page, isMobile);
    expect(pageErrors).toEqual([]);
  });
}
