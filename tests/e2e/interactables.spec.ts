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

test("brise, explique et restaure un objet interactif", async ({
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
  expect(
    interacted.heroes.find((hero) => hero.id === "brunhilda")?.actionsRemaining,
  ).toBe(0);
  expect(await readProcessedInteractableRequests(page)).toEqual([
    "interaction-objet-1",
  ]);
  expect(await readNextInteractableSequence(page)).toBe(2);
  await expect(
    page.getByText(/Tonneau douteux : intact → brise/),
  ).toBeVisible();

  const savedObjects = await readInteractables(page);
  const savedBrouhaha = interacted.brouhahaHistory;
  await page.reload();
  await expect
    .poll(async () => await readInteractables(page))
    .toEqual(savedObjects);
  expect((await readCanvasState(page)).brouhahaHistory).toEqual(savedBrouhaha);
  expect(await readProcessedInteractableRequests(page)).toEqual([
    "interaction-objet-1",
  ]);
  expect(await readNextInteractableSequence(page)).toBe(2);
});
