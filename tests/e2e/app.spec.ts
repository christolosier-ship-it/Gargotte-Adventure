import { expect, test } from "@playwright/test";

const getAutosaveExists = async (page: import("@playwright/test").Page) =>
  page.evaluate(async () => {
    const request = indexedDB.open("gargotte-adventure");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    try {
      const transaction = database.transaction("saves", "readonly");
      const store = transaction.objectStore("saves");
      const saveRequest = store.get("autosave");
      return await new Promise<boolean>((resolve, reject) => {
        saveRequest.onerror = () => reject(saveRequest.error);
        saveRequest.onsuccess = () => resolve(Boolean(saveRequest.result));
      });
    } finally {
      database.close();
    }
  });

test("affiche le socle jouable du Sprint 0", async ({ page }) => {
  await page.goto("./");

  await expect(
    page.getByRole("heading", { name: "Gargotte Adventure" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Le Château de Bastognac" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /plateau de Bastognac/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Nouvelle expédition" }),
  ).toBeEnabled();
});

test("crée et restaure une sauvegarde locale", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Nouvelle expédition" }).click();

  await expect(page.getByText("Expédition en cours")).toBeVisible();
  await expect(page.getByText("Enregistrée sur cet appareil")).toBeVisible();
  await expect.poll(() => getAutosaveExists(page)).toBe(true);

  await page.reload();
  await expect(
    page.getByRole("button", { name: /Continuer l'expédition 1/ }),
  ).toBeEnabled();
});

test("expose les artefacts PWA du build de production", async ({ page }) => {
  const manifestResponse = await page.goto("./manifest.webmanifest");
  expect(manifestResponse?.ok()).toBe(true);
  const manifest = await page.evaluate(() =>
    JSON.parse(document.body.innerText),
  );
  expect(manifest.name).toBe("Gargotte Adventure");
  expect(manifest.display).toBe("standalone");
  expect(manifest.orientation).toBe("landscape");

  const serviceWorkerResponse = await page.request.get("./sw.js");
  expect(serviceWorkerResponse.ok()).toBe(true);
  await expect(serviceWorkerResponse.text()).resolves.toContain("precache");
});
