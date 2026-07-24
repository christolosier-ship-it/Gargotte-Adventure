import { expect, test } from "@playwright/test";
import {
  bringPointIntoViewport,
  canvasPointForLogicalCell,
  enterRoom,
  readCanvasState,
  tapOrClick,
} from "./helpers/canvas";
import {
  readInteractables,
  readNextInteractableSequence,
  readProcessedInteractableRequests,
} from "./helpers/interactables";
import {
  readNextReinforcementSequence,
  readReinforcementHistory,
} from "./helpers/reinforcements";

test("brise, renforce et restaure un objet interactif", async ({
  page,
  isMobile,
}) => {
  await enterRoom(page);

  const initialObjects = await readInteractables(page);
  expect(initialObjects).toHaveLength(5);
  expect(
    initialObjects.find((object) => object.id === "tonneau-douteux-1"),
  ).toMatchObject({
    interactableId: "tonneau-bastognac",
    stateId: "intact",
    blocksMovement: true,
    blocksLineOfSight: true,
  });
  expect(await readProcessedInteractableRequests(page)).toEqual([]);
  expect(await readNextInteractableSequence(page)).toBe(1);
  expect(await readReinforcementHistory(page)).toEqual([]);

  await page
    .getByRole("button", { name: "Activer Brünhilda la Torgnole" })
    .click();
  await page
    .getByRole("button", {
      name: "Se déplacer en colonne 3, ligne 1",
    })
    .click();
  await expect
    .poll(async () => {
      const hero = (await readCanvasState(page)).heroes.find(
        (candidate) => candidate.id === "brunhilda",
      );
      return { position: hero?.position, actions: hero?.actionsRemaining };
    })
    .toEqual({ position: { column: 2, row: 0 }, actions: 1 });

  const point = await bringPointIntoViewport(page, () =>
    canvasPointForLogicalCell(page, { column: 2, row: 1 }, { x: 0, y: -24 }),
  );
  await tapOrClick(page, Boolean(isMobile), point);

  await expect
    .poll(async () =>
      (await readInteractables(page)).find(
        (object) => object.id === "tonneau-douteux-1",
      ),
    )
    .toMatchObject({
      stateId: "brise",
      blocksMovement: false,
      blocksLineOfSight: false,
    });
  const interacted = await readCanvasState(page);
  expect(interacted.brouhahaLevel).toBe(1);
  expect(interacted.enemies).toHaveLength(3);
  expect(
    interacted.enemies.find(
      (enemy) => enemy.id === "gobelin-bricoleur-spawn-1",
    ),
  ).toMatchObject({
    creatureId: "gobelin-bricoleur",
    position: { column: 6, row: 0 },
    alive: true,
  });
  expect(
    interacted.heroes.find((hero) => hero.id === "brunhilda")?.actionsRemaining,
  ).toBe(0);
  expect(await readProcessedInteractableRequests(page)).toEqual([
    "interaction-objet-1",
  ]);
  expect(await readNextInteractableSequence(page)).toBe(2);
  expect(await readReinforcementHistory(page)).toMatchObject([
    {
      reinforcementDefinitionId: "seuil-1-bricoleur",
      threshold: 1,
      activation: 1,
      result: "succeeded",
      createdInstanceIds: ["gobelin-bricoleur-spawn-1"],
    },
  ]);
  expect(await readNextReinforcementSequence(page)).toBe(2);
  await expect(
    page.getByText(/Tonneau douteux : intact → brise/),
  ).toBeVisible();
  await expect(page.getByText(/Renfort seuil-1-bricoleur réussi/)).toBeVisible();

  const savedObjects = await readInteractables(page);
  const savedBrouhaha = interacted.brouhahaHistory;
  const savedReinforcements = await readReinforcementHistory(page);
  await page.reload();
  await expect
    .poll(async () => await readInteractables(page))
    .toEqual(savedObjects);
  expect((await readCanvasState(page)).brouhahaHistory).toEqual(savedBrouhaha);
  expect(await readReinforcementHistory(page)).toEqual(savedReinforcements);
  expect(await readProcessedInteractableRequests(page)).toEqual([
    "interaction-objet-1",
  ]);
  expect(await readNextInteractableSequence(page)).toBe(2);
  expect(await readNextReinforcementSequence(page)).toBe(2);
});

test("pousse une table et résout le domino avec deux seuils", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("checkbox", { name: "Magdalena Coquinelle" }).check();
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
  await page
    .getByRole("button", { name: "Activer Magdalena Coquinelle" })
    .click();
  await page
    .getByRole("button", {
      name: "Se déplacer en colonne 3, ligne 3",
    })
    .click();
  await expect
    .poll(async () => {
      const hero = (await readCanvasState(page)).heroes.find(
        (candidate) => candidate.id === "magdalena",
      );
      return { position: hero?.position, actions: hero?.actionsRemaining };
    })
    .toEqual({ position: { column: 2, row: 2 }, actions: 1 });

  await page
    .getByRole("button", {
      name: /Pousser et renverser Table bancale/,
    })
    .click();

  await expect
    .poll(async () => {
      const objects = await readInteractables(page);
      return {
        table: objects.find((object) => object.id === "table-bancale-1"),
        pillar: objects.find((object) => object.id === "pilier-susceptible-1"),
        gate: objects.find((object) => object.id === "grille-grincante-1"),
      };
    })
    .toMatchObject({
      table: {
        position: { column: 4, row: 2 },
        stateId: "renversee",
      },
      pillar: { stateId: "fissure" },
      gate: { stateId: "ouverte", blocksMovement: false },
    });

  const chained = await readCanvasState(page);
  expect(chained.brouhahaLevel).toBe(2);
  expect(chained.enemies).toHaveLength(4);
  expect(chained.heroes.find((hero) => hero.id === "magdalena")).toMatchObject({
    hp: 7,
    actionsRemaining: 0,
  });
  expect(
    chained.enemies.find(
      (enemy) => enemy.id === "gobelin-bricoleur-spawn-1",
    ),
  ).toMatchObject({ hp: 4, position: { column: 6, row: 0 } });
  expect(
    chained.enemies.find(
      (enemy) => enemy.id === "gobelin-lance-tout-spawn-2",
    ),
  ).toMatchObject({ position: { column: 6, row: 3 }, alive: true });
  expect(await readProcessedInteractableRequests(page)).toEqual([
    "interaction-objet-1",
  ]);
  expect(await readReinforcementHistory(page)).toMatchObject([
    {
      reinforcementDefinitionId: "seuil-1-bricoleur",
      result: "succeeded",
      createdInstanceIds: ["gobelin-bricoleur-spawn-1"],
    },
    {
      reinforcementDefinitionId: "seuil-2-lance-tout",
      result: "partial",
      createdInstanceIds: ["gobelin-lance-tout-spawn-2"],
    },
  ]);
  expect(await readNextReinforcementSequence(page)).toBe(3);
  await expect(page.getByText(/Réaction pilier-libere-grille/)).toBeVisible();
  await expect(page.getByText(/magdalena subit 2 dégâts/)).toBeVisible();
  await expect(
    page.getByText(/Renfort seuil-2-lance-tout partiel/),
  ).toBeVisible();

  const savedObjects = await readInteractables(page);
  const savedBrouhaha = chained.brouhahaHistory;
  const savedReinforcements = await readReinforcementHistory(page);
  await page.reload();
  await expect
    .poll(async () => await readInteractables(page))
    .toEqual(savedObjects);
  expect((await readCanvasState(page)).brouhahaHistory).toEqual(savedBrouhaha);
  expect(await readReinforcementHistory(page)).toEqual(savedReinforcements);
  expect(await readNextReinforcementSequence(page)).toBe(3);
});
