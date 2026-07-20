import { expect, test, type Page } from "@playwright/test";

const getRoomSave = async (page: Page) =>
  page.evaluate(async () => {
    const request = indexedDB.open("gargotte-adventure");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    try {
      const transaction = database.transaction("saves", "readonly");
      const saveRequest = transaction.objectStore("saves").get("room-autosave");
      return await new Promise<unknown>((resolve, reject) => {
        saveRequest.onerror = () => reject(saveRequest.error);
        saveRequest.onsuccess = () => resolve(saveRequest.result);
      });
    } finally {
      database.close();
    }
  });

const readCanvasState = async (page: Page) => {
  const canvas = page.getByRole("img", { name: /Plateau tactique PixiJS/i });
  return canvas.evaluate((element) => ({
    phase: element.dataset.phase,
    turn: Number(element.dataset.turn),
    activeHero: element.dataset.activeHero,
    heroes: JSON.parse(element.dataset.heroes ?? "[]") as {
      id: string;
      position: { column: number; row: number };
      hp: number;
      actionsRemaining: number;
      activationCompleted: boolean;
    }[],
    enemies: JSON.parse(element.dataset.enemies ?? "[]") as {
      id: string;
      position: { column: number; row: number };
      hp: number;
      alive: boolean;
    }[],
  }));
};

test("sélectionne les héros officiels et lance la salle PixiJS", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Gargotte Adventure" }),
  ).toBeVisible();
  await expect(page.getByLabel("Brünhilda la Torgnole")).toBeChecked();
  await expect(page.getByLabel("Aelion Trois-Gorgées")).toBeVisible();
  await expect(page.getByLabel("Magdalena Coquinelle")).toBeVisible();
  await expect(page.getByLabel("Grompif Arcabidon")).toBeVisible();
  await page.getByLabel("Aelion Trois-Gorgées").check();
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  await expect(
    page.getByRole("img", { name: /Plateau tactique PixiJS/i }),
  ).toBeVisible();
  await expect(page.getByText("Salle en cours")).toBeVisible();
  await expect.poll(async () => Boolean(await getRoomSave(page))).toBe(true);
});

test("joue un déplacement, verrouille les phases et restaure la salle", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Aelion Trois-Gorgées").check();
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();

  await page
    .getByRole("button", { name: "Activer Brünhilda la Torgnole" })
    .click();
  await expect
    .poll(async () => (await readCanvasState(page)).activeHero)
    .toBe("brunhilda");
  await expect(
    page.getByText(/Héros actif: Brünhilda la Torgnole/),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "Se déplacer en colonne 2, ligne 1",
    })
    .click();
  await expect
    .poll(async () => {
      const state = await readCanvasState(page);
      const hero = state.heroes.find(
        (candidate) => candidate.id === "brunhilda",
      );
      return {
        position: hero?.position,
        actions: hero?.actionsRemaining,
      };
    })
    .toEqual({ position: { column: 1, row: 0 }, actions: 2 });

  await page.getByRole("button", { name: "Terminer l'activation" }).click();
  await expect(
    page.getByRole("button", { name: "Résoudre le tour ennemi" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Terminer le tour des héros" })
    .click();
  await expect
    .poll(async () => (await readCanvasState(page)).phase)
    .toBe("enemy-turn");
  await expect(
    page.getByRole("button", { name: "Résoudre le tour ennemi" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Résoudre le tour ennemi" }).click();
  await expect.poll(async () => (await readCanvasState(page)).turn).toBe(2);

  const beforeReload = await readCanvasState(page);
  await page.reload();
  await expect(page.getByRole("button", { name: "Reprendre" })).toBeEnabled();
  await page.getByRole("button", { name: "Reprendre" }).click();
  await expect
    .poll(async () => await readCanvasState(page))
    .toEqual(beforeReload);
});

test("atteint une victoire reproductible", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  await expect.poll(async () => Boolean(await getRoomSave(page))).toBe(true);

  await page.evaluate(async () => {
    const request = indexedDB.open("gargotte-adventure");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = database.transaction("saves", "readwrite");
    const store = transaction.objectStore("saves");
    const read = store.get("room-autosave");
    const save = await new Promise<{
      state: {
        room: {
          heroes: Record<string, unknown>[];
          enemies: Record<string, unknown>[];
          [key: string]: unknown;
        };
        selectedHeroIds: string[];
      };
      [key: string]: unknown;
    }>((resolve, reject) => {
      read.onerror = () => reject(read.error);
      read.onsuccess = () => resolve(read.result);
    });
    const hero = {
      ...save.state.room.heroes[0],
      position: { column: 6, row: 0 },
      atk: 10,
      range: 1,
      actionsRemaining: 3,
      activationCompleted: false,
    };
    const enemy = {
      ...save.state.room.enemies[0],
      position: { column: 7, row: 0 },
      hp: 1,
      maxHp: 1,
      alive: true,
      blocksMovement: true,
    };
    save.state.room = {
      ...save.state.room,
      heroes: [hero],
      enemies: [enemy],
      activeHeroId: null,
      phase: "heroes-turn",
    };
    save.state.selectedHeroIds = ["brunhilda"];
    store.put(save);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });

  await page.reload();
  await page.getByRole("button", { name: "Reprendre" }).click();
  await page
    .getByRole("button", { name: "Activer Brünhilda la Torgnole" })
    .click();
  await page
    .getByRole("button", { name: "Attaquer Gobelin Bricoleur" })
    .click();
  await expect
    .poll(async () => (await readCanvasState(page)).phase)
    .toBe("victory");
  await expect(page.getByText("Victoire")).toBeVisible();
  await expect(page.getByText("Salle nettoyée !")).toBeVisible();
});

test("expose le manifeste PWA français et le service worker", async ({
  page,
}) => {
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
