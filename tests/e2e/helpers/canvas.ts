import { expect, type Locator, type Page } from "@playwright/test";

export type GridPosition = { column: number; row: number };
export type ScreenPoint = { x: number; y: number };
export type CameraRotation = 0 | 90 | 180 | 270;

export interface CanvasHeroState {
  id: string;
  position: GridPosition;
  viewPosition?: GridPosition;
  hp: number;
  actionsRemaining: number;
  activationCompleted: boolean;
}

export interface CanvasEnemyState {
  id: string;
  position: GridPosition;
  viewPosition?: GridPosition;
  hp: number;
  alive: boolean;
}

export interface CanvasWallSegment {
  id: string;
  side: string;
  index: number;
  position: GridPosition;
  viewPosition: GridPosition;
  viewSide: string;
  orientation: string;
}

export interface CanvasState {
  phase: string;
  turn: number;
  activeHero: string;
  rotation: CameraRotation;
  visibleWalls: string[];
  wallSegments: CanvasWallSegment[];
  heroes: CanvasHeroState[];
  enemies: CanvasEnemyState[];
}

export const canvasLocator = (page: Page): Locator =>
  page.getByRole("img", { name: /Plateau tactique PixiJS/i });

export async function readCanvasState(page: Page): Promise<CanvasState> {
  return canvasLocator(page).evaluate((element) => ({
    phase: element.dataset.phase ?? "",
    turn: Number(element.dataset.turn),
    activeHero: element.dataset.activeHero ?? "",
    rotation: Number(element.dataset.viewRotation ?? 0) as CameraRotation,
    visibleWalls: JSON.parse(element.dataset.visibleWalls ?? "[]") as string[],
    wallSegments: JSON.parse(
      element.dataset.wallSegments ?? "[]",
    ) as CanvasWallSegment[],
    heroes: JSON.parse(element.dataset.heroes ?? "[]") as CanvasHeroState[],
    enemies: JSON.parse(element.dataset.enemies ?? "[]") as CanvasEnemyState[],
  }));
}

export async function canvasPointForLogicalCell(
  page: Page,
  position: GridPosition,
  nudge: ScreenPoint = { x: 0, y: 0 },
): Promise<ScreenPoint> {
  return canvasLocator(page).evaluate(
    (element, { position: logicalPosition, nudge: offset }) => {
      const projection = JSON.parse(element.dataset.projection ?? "{}");
      const camera = JSON.parse(element.dataset.camera ?? "{}");
      const dimensions = JSON.parse(element.dataset.roomDimensions ?? "{}");
      const rotation = Number(element.dataset.viewRotation ?? 0) as CameraRotation;
      const rect = element.getBoundingClientRect();
      const viewed =
        rotation === 90
          ? {
              column: logicalPosition.row,
              row: dimensions.width - 1 - logicalPosition.column,
            }
          : rotation === 180
            ? {
                column: dimensions.width - 1 - logicalPosition.column,
                row: dimensions.height - 1 - logicalPosition.row,
              }
            : rotation === 270
              ? {
                  column: dimensions.height - 1 - logicalPosition.row,
                  row: logicalPosition.column,
                }
              : logicalPosition;
      const localX =
        projection.originX +
        ((viewed.column - viewed.row) * projection.tileWidth) / 2 +
        offset.x;
      const localY =
        projection.originY +
        ((viewed.column + viewed.row) * projection.tileHeight) / 2 +
        offset.y;
      return {
        x: rect.left + camera.offsetX + localX * camera.scale,
        y: rect.top + camera.offsetY + localY * camera.scale,
      };
    },
    { position, nudge },
  );
}

export async function bringPointIntoViewport(
  page: Page,
  resolvePoint: () => Promise<ScreenPoint>,
): Promise<ScreenPoint> {
  const viewport = page.viewportSize();
  if (!viewport) return resolvePoint();
  const margin = 48;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const point = await resolvePoint();
    const deltaY =
      point.y < margin
        ? point.y - margin
        : point.y > viewport.height - margin
          ? point.y - (viewport.height - margin)
          : 0;
    if (Math.abs(deltaY) < 1) return point;
    await page.evaluate((offset) => window.scrollBy(0, offset), deltaY);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
  }
  const point = await resolvePoint();
  expect(point.y).toBeGreaterThanOrEqual(margin);
  expect(point.y).toBeLessThanOrEqual(viewport.height - margin);
  return point;
}

export async function tapOrClick(
  page: Page,
  isMobile: boolean,
  point: ScreenPoint,
): Promise<void> {
  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

export async function expectHeroAt(
  page: Page,
  heroId: string,
  position: GridPosition,
  actionsRemaining: number,
): Promise<void> {
  await expect
    .poll(async () => {
      const hero = (await readCanvasState(page)).heroes.find(
        (candidate) => candidate.id === heroId,
      );
      return {
        position: hero?.position,
        actionsRemaining: hero?.actionsRemaining,
      };
    })
    .toEqual({ position, actionsRemaining });
}

export async function combatantAssetStatus(
  page: Page,
  combatantId: string,
): Promise<string | null> {
  return canvasLocator(page).evaluate(
    (element, id) => element.getAttribute(`data-asset-${id}`),
    combatantId,
  );
}

export async function environmentAssetStatus(
  page: Page,
  key: string,
): Promise<string | null> {
  return canvasLocator(page).evaluate(
    (element, statusKey) =>
      element.getAttribute(`data-asset-environment-${statusKey}`),
    key,
  );
}

export async function enterRoom(page: Page): Promise<void> {
  await page.goto("./");
  await page.getByRole("button", { name: "Entrer dans la salle" }).click();
}

export async function activateBrunhilda(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "Activer Brünhilda la Torgnole" })
    .click();
}

export async function moveBrunhilda(
  page: Page,
  isMobile: boolean,
  target: GridPosition = { column: 1, row: 0 },
  nudge: ScreenPoint = { x: 0, y: 0 },
): Promise<void> {
  await activateBrunhilda(page);
  const point = await bringPointIntoViewport(page, () =>
    canvasPointForLogicalCell(page, target, nudge),
  );
  await tapOrClick(page, isMobile, point);
  await expectHeroAt(page, "brunhilda", target, 2);
}
