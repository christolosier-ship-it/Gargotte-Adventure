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

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) =>
    console.error(`[pageerror] ${error.stack ?? error.message}`),
  );
});

const getExpeditionSave = async (page: Page) =>
  page.evaluate(async () => {
    const request = indexedDB.open("gargotte-adventure");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    try {
      const transaction = database.transaction("saves", "readonly");
      const saveRequest = transaction
        .objectStore("saves")
        .get("expedition-autosave");
      return await new Promise<unknown>((resolve, reject) => {
        saveRequest.onerror = () => reject(saveRequest.error);
        saveRequest.onsuccess = () => resolve(saveRequest.result);
      });
    } finally {
      database.close();
    }
  });

const prepareCurrentRoomForVictory = async (
  page: Page,
  targetRoomId?: "bastognac-salle-3",
) =>
  page.evaluate(async (targetId) => {
    const request = indexedDB.open("gargotte-adventure");
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = database.transaction("saves", "readwrite");
    const store = transaction.objectStore("saves");
    const read = store.get("expedition-autosave");
    const save = await new Promise<{
      state: {
        expedition: {
          currentRoomId: string;
          selectedHeroIds: string[];
          visitedRoomIds: string[];
          completedRoomIds: string[];
          persistentHeroes: Record<string, unknown>[];
          roomStates: Record<
            string,
            {
              heroes: Record<string, unknown>[];
              enemies: Record<string, unknown>[];
              [key: string]: unknown;
            }
          >;
          [key: string]: unknown;
        };
        [key: string]: unknown;
      };
      [key: string]: unknown;
    }>((resolve, reject) => {
      read.onerror = () => reject(read.error);
      read.onsuccess = () => resolve(read.result);
    });
    const expedition = save.state.expedition;
    const sourceRoom = expedition.roomStates[expedition.currentRoomId]!;
    const hero = {
      ...sourceRoom.heroes[0],
      position: { column: 6, row: 0 },
      atk: 10,
      range: 1,
      hp: 12,
      maxHp: 12,
      alive: true,
      actionsRemaining: 3,
      activationCompleted: false,
    };
    const enemy = {
      ...sourceRoom.enemies[0],
      id: `${targetId ?? expedition.currentRoomId}-cible`,
      position: { column: 7, row: 0 },
      hp: 1,
      maxHp: 1,
      alive: true,
      blocksMovement: true,
    };
    const currentRoomId = targetId ?? expedition.currentRoomId;
    const currentRoom = {
      ...sourceRoom,
      scenarioId: currentRoomId,
      heroes: [hero],
      enemies: [enemy],
      activeHeroId: null,
      enemyTurnRoster: [],
      phase: "heroes-turn",
    };

    if (targetId) {
      const completedRoom = (id: string) => ({
        ...sourceRoom,
        scenarioId: id,
        heroes: [hero],
        enemies: sourceRoom.enemies.map((candidate) => ({
          ...candidate,
          hp: 0,
          alive: false,
          blocksMovement: false,
        })),
        activeHeroId: null,
        enemyTurnRoster: [],
        phase: "victory",
      });
      expedition.currentRoomId = targetId;
      expedition.visitedRoomIds = [
        "bastognac-salle-1",
        "bastognac-salle-2",
        "bastognac-salle-3",
      ];
      expedition.completedRoomIds = ["bastognac-salle-1", "bastognac-salle-2"];
      expedition.roomStates = {
        "bastognac-salle-1": completedRoom("bastognac-salle-1"),
        "bastognac-salle-2": completedRoom("bastognac-salle-2"),
        "bastognac-salle-3": currentRoom,
      };
    } else expedition.roomStates[currentRoomId] = currentRoom;

    expedition.selectedHeroIds = ["brunhilda"];
    expedition.persistentHeroes = [
      { id: "brunhilda", hp: 12, maxHp: 12, alive: true },
    ];
    store.put(save);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, targetRoomId);

test("sélectionne les héros officiels et lance le micro-donjon", async ({
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
  await page
    .getByRole("button", { name: "Entrer dans le micro-donjon" })
    .click();
  await expect(canvasLocator(page)).toBeVisible();
  await expect(page.getByText("Salle en cours")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Le vestibule des maladroits" }),
  ).toBeVisible();
  await expect
    .poll(async () => Boolean(await getExpeditionSave(page)))
    .toBe(true);
});

test("joue un déplacement, verrouille les phases et restaure l’expédition", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Aelion Trois-Gorgées").check();
  await page
    .getByRole("button", { name: "Entrer dans le micro-donjon" })
    .click();

  await activateBrunhilda(page);
  await expect
    .poll(async () => (await readCanvasState(page)).activeHero)
    .toBe("brunhilda");
  await page
    .getByRole("button", { name: "Se déplacer en colonne 2, ligne 1" })
    .click();
  await expectHeroAt(page, "brunhilda", { column: 1, row: 0 }, 2);

  await page.getByRole("button", { name: "Terminer l’activation" }).click();
  await page
    .getByRole("button", { name: "Terminer le tour des héros" })
    .click();
  await expect
    .poll(async () => (await readCanvasState(page)).phase)
    .toBe("enemy-turn");
  await page.getByRole("button", { name: "Résoudre le tour ennemi" }).click();
  await expect.poll(async () => (await readCanvasState(page)).turn).toBe(2);

  const beforeReload = await readCanvasState(page);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Reprendre l’expédition" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Reprendre l’expédition" }).click();
  await expect.poll(async () => readCanvasState(page)).toEqual(beforeReload);
});

test("sécurise une salle puis passe explicitement à la suivante", async ({
  page,
}) => {
  await enterRoom(page);
  await expect
    .poll(async () => Boolean(await getExpeditionSave(page)))
    .toBe(true);
  await prepareCurrentRoomForVictory(page);

  await page.reload();
  await page.getByRole("button", { name: "Reprendre l’expédition" }).click();
  await activateBrunhilda(page);
  await page
    .getByRole("button", { name: "Attaquer Gobelin Bricoleur" })
    .click();
  await expect
    .poll(async () => (await readCanvasState(page)).phase)
    .toBe("victory");
  await expect(
    page.getByText("Salle sécurisée", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Salle sécurisée. La sortie peut être empruntée."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Entrer dans la galerie" }).click();
  await expect(
    page.getByRole("heading", {
      name: "La galerie des tonneaux susceptibles",
    }),
  ).toBeVisible();
  await expect
    .poll(async () => (await readCanvasState(page)).phase)
    .toBe("heroes-turn");
  await expect
    .poll(async () => (await readCanvasState(page)).processedSpawnRequests)
    .toEqual(["population-galerie-bricoleur", "population-galerie-lance-tout"]);
});

test("masque les commandes techniques hors mode diagnostic", async ({
  page,
}) => {
  await enterRoom(page);
  await expect(page.getByRole("button", { name: /Combat engagé/ })).toHaveCount(
    0,
  );
  const diagnostic = page.getByRole("button", {
    name: "Activer le mode diagnostic",
  });
  await expect(diagnostic).toHaveAttribute("aria-pressed", "false");
  await diagnostic.click();
  await expect(
    page.getByRole("button", { name: /Combat engagé/ }),
  ).toBeVisible();
  await expect(
    page.getByText("Mode diagnostic actif", { exact: true }),
  ).toBeVisible();
});

test("termine la troisième salle, affiche le résultat et permet le rejeu", async ({
  page,
}) => {
  await enterRoom(page);
  await expect
    .poll(async () => Boolean(await getExpeditionSave(page)))
    .toBe(true);
  await prepareCurrentRoomForVictory(page, "bastognac-salle-3");

  await page.reload();
  const resume = page.getByRole("button", { name: "Reprendre l’expédition" });
  await expect(resume).toBeEnabled();
  await resume.click();
  await activateBrunhilda(page);
  await page
    .getByRole("button", { name: "Attaquer Gobelin Bricoleur" })
    .click();
  await expect(page.getByText("Victoire", { exact: true })).toBeVisible();
  await expect(page.getByText(/Le chemin de ronde est nettoyé/)).toBeVisible();
  await page.getByRole("button", { name: "Rejouer le micro-donjon" }).click();
  await expect(
    page.getByRole("heading", { name: "Le vestibule des maladroits" }),
  ).toBeVisible();
  await expect
    .poll(async () => (await readCanvasState(page)).phase)
    .toBe("heroes-turn");
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

test("pique une case proche d’une arête commune du losange", async ({
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

test("préserve les coordonnées logiques lors d’un redimensionnement paysage", async ({
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
    .poll(async () =>
      canvas.evaluate((element) => element.dataset.assetManifest),
    )
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
      canvasLocator(page).evaluate((element) => element.dataset.assetManifest),
    )
    .toBe("loaded");
  await activateBrunhilda(page);
  const target = { column: 1, row: 0 };
  const point = await canvasPointForLogicalCell(page, target);
  await tapOrClick(page, isMobile, point);
  await expectHeroAt(page, "brunhilda", target, 2);
});
