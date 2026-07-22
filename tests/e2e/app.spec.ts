import { expect, test, type Page } from "@playwright/test";
import {
  activateBrunhilda,
  canvasLocator,
  canvasPointForLogicalCell,
  enterRoom,
  expectHeroAt,
  readCanvasState,
  tapOrClick,
} from "./helpers/canvas";

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
  await expect(canvasLocator(page)).toBeVisible();
  await expect(page.getByText("Salle en cours")).toBeVisible();
  await expect.poll(async () => Boolean(await getRoomSave(page))).toBe(true);
});

test("joue un déplacement, verrouille les phases et restaure la salle", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Aelion Trois-Gorgées").check();
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();

  await activateBrunhilda(page);
  await expect
    .poll(async () => (await readCanvasState(page)).activeHero)
    .toBe("brunhilda");
  await expect(
    page.getByText(/Héros actif: Brünhilda la Torgnole/),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Se déplacer en colonne 2, ligne 1" })
    .click();
  await expectHeroAt(page, "brunhilda", { column: 1, row: 0 }, 2);

  await page.getByRole("button", { name: "Terminer l'activation" }).click();
  await expect(
    page.getByRole("button", { name: "Résoudre le tour ennemi" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Terminer le tour des héros" })
    .click();
  await expect.poll(async () => (await readCanvasState(page)).phase).toBe(
    "enemy-turn",
  );
  await expect(
    page.getByRole("button", { name: "Résoudre le tour ennemi" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Résoudre le tour ennemi" }).click();
  await expect.poll(async () => (await readCanvasState(page)).turn).toBe(2);

  const beforeReload = await readCanvasState(page);
  await page.reload();
  await expect(page.getByRole("button", { name: "Reprendre" })).toBeEnabled();
  await page.getByRole("button", { name: "Reprendre" }).click();
  await expect.poll(async () => readCanvasState(page)).toEqual(beforeReload);
});

test("atteint une victoire reproductible", async ({ page }) => {
  await enterRoom(page);
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
  await activateBrunhilda(page);
  await page
    .getByRole("button", { name: "Attaquer Gobelin Bricoleur" })
    .click();
  await expect.poll(async () => (await readCanvasState(page)).phase).toBe(
    "victory",
  );
  await expect(page.getByText("Victoire")).toBeVisible();
  await expect(page.getByText("Salle nettoyée !")).toBeVisible();
});

test("déplace Brünhilda par picking réel du canvas", async ({
  page,
  isMobile,
}) => {
  await enterRoom(page);
  await activateBrunhilda(page);
  const target = { column: 1, row: 0 };
  const point = await canvasPointForLogicalCell(page, target);
  await tapOrClick(page, isMobile, point);
  await expectHeroAt(page, "brunhilda", target, 2);
});

test("pique une case proche d'une arête commune du losange", async ({
  page,
  isMobile,
}) => {
  await enterRoom(page);
  await activateBrunhilda(page);
  const target = { column: 1, row: 0 };
  const point = await canvasPointForLogicalCell(page, target, { x: 56, y: 0 });
  await tapOrClick(page, isMobile, point);
  await expectHeroAt(page, "brunhilda", target, 2);
});

test("préserve les coordonnées logiques lors d'un redimensionnement paysage", async ({
  page,
}) => {
  await enterRoom(page);
  await activateBrunhilda(page);
  const before = await readCanvasState(page);
  await page.setViewportSize({ width: 1024, height: 576 });
  const canvas = canvasLocator(page);
  await expect
    .poll(async () =>
      canvas.evaluate((element) => JSON.parse(element.dataset.camera ?? "{}")),
    )
    .toHaveProperty("scale");
  expect(await readCanvasState(page)).toEqual(before);
  await expect(canvas).toBeInViewport();
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

test("démarre avec les assets techniques et expose le manifeste runtime", async ({
  page,
}) => {
  await enterRoom(page);
  const canvas = canvasLocator(page);
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => canvas.evaluate((element) => element.dataset.assetManifest))
    .toBe("loaded");
  const manifest = await page.request.get("./assets/isometric/manifest.json");
  expect(manifest.ok()).toBe(true);
  expect(
    await page.request.get("./assets/isometric/tiles/fallback-tile.svg"),
  ).toBeOK();
  await expect(canvas).toBeInViewport();
});

test("reste jouable quand une texture manquante déclenche un fallback non fatal", async ({
  page,
  isMobile,
}) => {
  await enterRoom(page);
  await expect
    .poll(async () =>
      canvasLocator(page).evaluate(
        (element) => element.dataset.assetManifest,
      ),
    )
    .toBe("loaded");
  await activateBrunhilda(page);
  const target = { column: 1, row: 0 };
  const point = await canvasPointForLogicalCell(page, target);
  await tapOrClick(page, isMobile, point);
  await expectHeroAt(page, "brunhilda", target, 2);
});
