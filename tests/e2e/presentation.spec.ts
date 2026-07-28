import { expect, test, type Page } from "@playwright/test";
import { activateBrunhilda, canvasLocator, enterRoom } from "./helpers/canvas";

const boardHost = (page: Page) => page.locator("[data-board]");
const eventEntries = (page: Page) => page.locator("[data-events] > li");

async function moveBrunhildaWithButton(page: Page): Promise<void> {
  await activateBrunhilda(page);
  await page
    .getByRole("button", { name: "Se déplacer en colonne 2, ligne 1" })
    .click();
}

async function activateDiagnosticMode(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Activer le mode diagnostic" })
    .click();
  await expect(
    page.getByRole("button", { name: /Combat engagé/ }),
  ).toBeVisible();
}

test("expose des réglages audio persistants et non bloquants", async ({
  page,
}) => {
  await enterRoom(page);
  const mute = page.getByRole("button", { name: "Couper le son" });
  await expect(mute).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("slider", { name: "Volume général" }),
  ).toHaveValue("0.7");

  await mute.click();
  await expect(
    page.getByRole("button", { name: "Activer le son" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(boardHost(page)).toHaveAttribute("data-audio-muted", "true");

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Activer le son" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("route une action vers un journal groupé et des cues bornés", async ({
  page,
}) => {
  await enterRoom(page);
  await moveBrunhildaWithButton(page);

  const latest = page.locator("[data-events] > .event-entry").first();
  await expect(latest).toHaveAttribute("data-event-types", /combatant-moved/);
  await expect(latest).not.toContainText("combatant-moved");
  await expect
    .poll(async () =>
      Number(
        await canvasLocator(page).getAttribute("data-presentation-cue-count"),
      ),
    )
    .toBeGreaterThan(0);

  await activateDiagnosticMode(page);
  await page.getByRole("button", { name: /Combat engagé/ }).click();
  await expect
    .poll(async () =>
      Number(await boardHost(page).getAttribute("data-audio-cache-size")),
    )
    .toBeGreaterThan(0);

  for (let index = 0; index < 7; index += 1)
    await page.getByRole("button", { name: /Combat engagé/ }).click();
  await expect(eventEntries(page)).toHaveCount(6);
});

test("respecte le mouvement réduit et détruit les transitoires", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enterRoom(page);
  await expect(page.locator("strong[data-reduced-motion]")).toHaveText(
    "Activé",
  );

  await moveBrunhildaWithButton(page);
  await expect(canvasLocator(page)).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
  await expect
    .poll(async () =>
      Number(await boardHost(page).getAttribute("data-transient-objects")),
    )
    .toBe(0);
});

test("reprend sans replay et conserve un renderer stable", async ({ page }) => {
  await enterRoom(page);
  await moveBrunhildaWithButton(page);
  const canvas = canvasLocator(page);
  const listenersBefore = await canvas.getAttribute("data-listener-counts");
  const displayBefore = await boardHost(page).getAttribute(
    "data-display-objects",
  );
  await expect
    .poll(async () =>
      Number(await boardHost(page).getAttribute("data-transient-objects")),
    )
    .toBe(0);

  await page.reload();
  await page
    .getByRole("button", { name: "Reprendre l’expédition" })
    .click();
  await expect(canvasLocator(page)).toHaveAttribute(
    "data-presentation-cue-count",
    "0",
  );
  await expect(boardHost(page)).toHaveAttribute("data-transient-objects", "0");
  await expect(page.locator("[data-events]")).not.toContainText(
    "se déplace en colonne",
  );

  for (let index = 0; index < 4; index += 1)
    await page
      .getByRole("button", { name: "Pivoter la caméra de 90°" })
      .click();

  await expect(page.locator("[data-board] canvas")).toHaveCount(1);
  await expect(canvasLocator(page)).toHaveAttribute(
    "data-listener-counts",
    listenersBefore ?? "",
  );
  await expect(boardHost(page)).toHaveAttribute(
    "data-display-objects",
    displayBefore ?? "",
  );
});
