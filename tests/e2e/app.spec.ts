import { expect, test } from "@playwright/test";
const getRoomSave = async (page: import("@playwright/test").Page) =>
  page.evaluate(async () => {
    const request = indexedDB.open("gargotte-adventure");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    try {
      const tx = database.transaction("saves", "readonly");
      const req = tx.objectStore("saves").get("room-autosave");
      return await new Promise<unknown>((resolve, reject) => {
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });
    } finally {
      database.close();
    }
  });
test("charge, sélectionne des héros et lance la salle PixiJS", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Gargotte Adventure" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Plateau tactique PixiJS/i }),
  ).toBeVisible();
  await page.getByLabel("azeline").check();
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  await expect(page.getByText("Salle en cours")).toBeVisible();
  await expect.poll(() => getRoomSave(page)).not.toBeNull();
});
test("joue déplacement, activation, tour ennemi et restauration", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  await page
    .getByRole("img", { name: /Plateau tactique PixiJS/i })
    .click({ position: { x: 95, y: 90 } });
  await expect(page.getByText(/Héros actif:/)).toBeVisible();
  await page.getByRole("button", { name: "Terminer l'activation" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Reprendre" })).toBeEnabled();
  await page.getByRole("button", { name: "Reprendre" }).click();
  await expect(page.getByText(/Salle restaurée|Enregistrée/)).toBeVisible();
});
test("expose manifeste PWA français et service worker", async ({ page }) => {
  const manifestResponse = await page.goto("./manifest.webmanifest");
  expect(manifestResponse?.ok()).toBe(true);
  const manifest = await page.evaluate(() =>
    JSON.parse(document.body.innerText),
  );
  expect(manifest.name).toBe("Gargotte Adventure");
  expect(manifest.lang).toBe("fr");
  expect(manifest.orientation).toBe("landscape");
  const serviceWorkerResponse = await page.request.get("./sw.js");
  expect(serviceWorkerResponse.ok()).toBe(true);
  await expect(serviceWorkerResponse.text()).resolves.toContain("precache");
});
