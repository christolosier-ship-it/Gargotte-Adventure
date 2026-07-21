import { Application, Container, Graphics, Polygon, Text } from "pixi.js";
import type {
  Combatant,
  GridPosition,
  HeroState,
  RoomState,
} from "@gargotte/engine";
import tokens from "../../../design/isometric/tokens.json";
import {
  gridToScreen,
  isometricDepthLayer,
  isometricTileGeometry,
  stableDepth,
  type IsometricProjection,
} from "./projection";

export interface TacticalHighlights {
  reachable: GridPosition[];
  attackable: string[];
}

export interface TabletopRenderer {
  destroy(): void;
  setExpeditionActive(active: boolean): void;
  renderRoom(state: RoomState, highlights?: TacticalHighlights): void;
  onCellSelected(listener: (position: GridPosition) => void): void;
  onHeroSelected(listener: (heroId: string) => void): void;
  onEnemySelected(listener: (enemyId: string) => void): void;
}

const boardPaddingX = 46;
const boardPaddingTop = 84;
const boardPaddingBottom = 32;
const gridWidth = 8;
const gridHeight = 4;
const gridPixelWidth =
  (gridWidth + gridHeight) * isometricTileGeometry.halfTileWidth;
const gridPixelHeight =
  (gridWidth + gridHeight) * isometricTileGeometry.halfTileHeight;
const boardWidth = gridPixelWidth + boardPaddingX * 2;
const boardHeight = gridPixelHeight + boardPaddingTop + boardPaddingBottom;
const gridProjection: IsometricProjection = {
  tileWidth: isometricTileGeometry.tileWidth,
  tileHeight: isometricTileGeometry.tileHeight,
  originX: gridHeight * isometricTileGeometry.halfTileWidth,
  originY: isometricTileGeometry.halfTileHeight,
};
const tileHitArea = new Polygon([
  0,
  -isometricTileGeometry.halfTileHeight,
  isometricTileGeometry.halfTileWidth,
  0,
  0,
  isometricTileGeometry.halfTileHeight,
  -isometricTileGeometry.halfTileWidth,
  0,
]);

type TileState =
  "base" | "alternate" | "reachable" | "selected" | "attackable" | "blocked";

const tileStyle: Record<TileState, { color: number; alpha: number }> = {
  base: { color: tokenNumber(tokens.color.primitive.stoneDark), alpha: 1 },
  alternate: {
    color: tokenNumber(tokens.color.primitive.stoneMid),
    alpha: 1,
  },
  reachable: {
    color: tokenNumber(tokens.color.primitive.green),
    alpha: tokens.opacity.reachable,
  },
  selected: {
    color: tokenNumber(tokens.color.primitive.gold),
    alpha: tokens.opacity.selected,
  },
  attackable: {
    color: tokenNumber(tokens.color.primitive.danger),
    alpha: tokens.opacity.attackable,
  },
  blocked: { color: tokenNumber(tokens.color.primitive.woodMid), alpha: 0.88 },
};

function diamond(): number[] {
  return [
    0,
    -isometricTileGeometry.halfTileHeight,
    isometricTileGeometry.halfTileWidth,
    0,
    0,
    isometricTileGeometry.halfTileHeight,
    -isometricTileGeometry.halfTileWidth,
    0,
  ];
}

function tokenNumber(value: string): number {
  return Number(value.replace("#", "0x"));
}

export async function createTabletopRenderer(
  host: HTMLElement,
): Promise<TabletopRenderer> {
  const app = new Application();
  await app.init({
    resizeTo: host,
    antialias: true,
    background: "#17100d",
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  app.canvas.setAttribute("aria-label", "Plateau tactique PixiJS de Bastognac");
  app.canvas.setAttribute("role", "img");
  app.canvas.tabIndex = 0;
  host.replaceChildren(app.canvas);

  const stage = new Container();
  stage.sortableChildren = true;
  app.stage.addChild(stage);
  const listeners = {
    cell: [] as ((position: GridPosition) => void)[],
    hero: [] as ((id: string) => void)[],
    enemy: [] as ((id: string) => void)[],
  };

  function clearStage(): void {
    for (const child of stage.removeChildren())
      child.destroy({ children: true });
  }

  function projectedPosition(position: GridPosition): { x: number; y: number } {
    const screen = gridToScreen(position, gridProjection);
    return {
      x: boardPaddingX + screen.x,
      y: boardPaddingTop + screen.y,
    };
  }

  function tileState(
    state: RoomState,
    position: GridPosition,
    reachable: boolean,
    selected: boolean,
    attackable: boolean,
  ): TileState {
    if (
      state.obstacles.some(
        (obstacle) =>
          obstacle.column === position.column && obstacle.row === position.row,
      )
    )
      return "blocked";
    if (selected) return "selected";
    if (attackable) return "attackable";
    if (reachable) return "reachable";
    return (position.column + position.row) % 2 === 0 ? "base" : "alternate";
  }

  function drawTile(position: GridPosition, tileKind: TileState): void {
    const screen = projectedPosition(position);
    const style = tileStyle[tileKind];
    const cell = new Graphics()
      .poly(diamond())
      .fill({ color: style.color, alpha: style.alpha })
      .stroke({ color: tokenNumber(tokens.color.primitive.line), width: 2 });
    cell.eventMode = "static";
    cell.cursor = "pointer";
    cell.hitArea = tileHitArea;
    cell.label = `cell:${position.column},${position.row}`;
    cell.position.set(screen.x, screen.y);
    cell.zIndex =
      isometricDepthLayer.floor +
      stableDepth(screen.y, gridProjection.tileHeight, 0);
    cell.on("pointertap", () =>
      listeners.cell.forEach((listener) => listener(position)),
    );
    stage.addChild(cell);

    if (tileKind === "blocked") {
      const obstacle = new Graphics()
        .roundRect(-22, -46, 44, 58, 8)
        .fill({
          color: tokenNumber(tokens.color.primitive.woodMid),
          alpha: 0.95,
        })
        .stroke({ color: tokenNumber(tokens.color.primitive.gold), width: 3 });
      obstacle.position.set(screen.x, screen.y + 6);
      obstacle.zIndex =
        isometricDepthLayer.object +
        stableDepth(screen.y, gridProjection.tileHeight, 100);
      stage.addChild(obstacle);
    }
  }

  function drawToken(
    combatant: Combatant | HeroState,
    active: boolean,
    attackable: boolean,
    tieBreaker: number,
  ): void {
    const screen = projectedPosition(combatant.position);
    const token = new Container();
    token.eventMode = "static";
    token.cursor = "pointer";
    token.label = `${combatant.kind}:${combatant.id}`;
    token.zIndex =
      isometricDepthLayer.object +
      stableDepth(screen.y, gridProjection.tileHeight, 200 + tieBreaker);
    token.on("pointertap", () =>
      combatant.kind === "hero"
        ? listeners.hero.forEach((listener) => listener(combatant.id))
        : listeners.enemy.forEach((listener) => listener(combatant.id)),
    );

    const shadow = new Graphics()
      .ellipse(0, 22, 30, 10)
      .fill({ color: 0x000000, alpha: tokens.opacity.shadow });
    const tokenBody = new Graphics()
      .circle(0, -8, 27)
      .fill({ color: combatant.kind === "hero" ? 0xd7b568 : 0x637f37 })
      .stroke({
        color: active ? 0xf1c86f : attackable ? 0xd45f57 : 0xf8ecd2,
        width: 4,
      });
    const label = new Text({
      text: combatant.name.slice(0, 2).toUpperCase(),
      style: { fill: 0x20140f, fontSize: 16, fontWeight: "700" },
    });
    label.anchor.set(0.5);
    label.position.set(0, -8);
    const hp = new Text({
      text: `${combatant.hp}/${combatant.maxHp}`,
      style: { fill: 0xf8ecd2, fontSize: 12, fontWeight: "700" },
    });
    hp.anchor.set(0.5);
    hp.position.set(0, 34);
    token.addChild(shadow, tokenBody, label, hp);
    token.position.set(screen.x, screen.y + gridProjection.tileHeight / 2);
    stage.addChild(token);
  }

  function renderRoom(
    state: RoomState,
    highlights: TacticalHighlights = { reachable: [], attackable: [] },
  ): void {
    clearStage();
    app.canvas.dataset.phase = state.phase;
    app.canvas.dataset.turn = String(state.turn);
    app.canvas.dataset.activeHero = state.activeHeroId ?? "";
    app.canvas.dataset.heroes = JSON.stringify(
      state.heroes.map((hero) => ({
        id: hero.id,
        position: hero.position,
        hp: hero.hp,
        actionsRemaining: hero.actionsRemaining,
        activationCompleted: hero.activationCompleted,
      })),
    );
    app.canvas.dataset.enemies = JSON.stringify(
      state.enemies.map((enemy) => ({
        id: enemy.id,
        position: enemy.position,
        hp: enemy.hp,
        alive: enemy.alive,
      })),
    );

    const backdrop = new Graphics()
      .roundRect(0, 0, boardWidth, boardHeight, 28)
      .fill({ color: 0x2a1d18 })
      .stroke({ color: 0x806044, width: 5 });
    backdrop.zIndex = isometricDepthLayer.backdrop;
    stage.addChild(backdrop);

    const title = new Text({
      text:
        state.phase === "victory"
          ? "VICTOIRE"
          : state.phase === "defeat"
            ? "DÉFAITE"
            : "BASTOGNAC · SALLE TACTIQUE",
      style: { fill: 0xf1c86f, fontSize: 22, fontWeight: "700" },
    });
    title.position.set(boardPaddingX, 22);
    title.zIndex = isometricDepthLayer.interface;
    stage.addChild(title);

    const attackablePositions = state.enemies
      .filter(
        (enemy) => enemy.alive && highlights.attackable.includes(enemy.id),
      )
      .map((enemy) => enemy.position);

    for (let row = 0; row < state.height; row += 1) {
      for (let column = 0; column < state.width; column += 1) {
        const position = { column, row };
        const reachable = highlights.reachable.some(
          (candidate) => candidate.column === column && candidate.row === row,
        );
        const selected = state.heroes.some(
          (hero) =>
            hero.alive &&
            hero.id === state.activeHeroId &&
            hero.position.column === column &&
            hero.position.row === row,
        );
        const attackable = attackablePositions.some(
          (candidate) => candidate.column === column && candidate.row === row,
        );
        drawTile(
          position,
          tileState(state, position, reachable, selected, attackable),
        );
      }
    }

    for (const hero of state.heroes.filter((candidate) => candidate.alive))
      drawToken(
        hero,
        hero.id === state.activeHeroId,
        false,
        state.heroes.indexOf(hero),
      );
    for (const enemy of state.enemies.filter((candidate) => candidate.alive))
      drawToken(
        enemy,
        false,
        highlights.attackable.includes(enemy.id),
        state.enemies.indexOf(enemy),
      );

    host.dataset.displayObjects = String(stage.children.length);
    resize();
  }

  function resize(): void {
    const scale = Math.min(
      host.clientWidth / boardWidth,
      host.clientHeight / boardHeight,
    );
    stage.scale.set(scale);
    stage.position.set(
      Math.max(0, (host.clientWidth - boardWidth * scale) / 2),
      Math.max(0, (host.clientHeight - boardHeight * scale) / 2),
    );
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);

  return {
    destroy() {
      observer.disconnect();
      clearStage();
      app.destroy(true, { children: true });
    },
    setExpeditionActive() {},
    renderRoom,
    onCellSelected(listener) {
      listeners.cell.push(listener);
    },
    onHeroSelected(listener) {
      listeners.hero.push(listener);
    },
    onEnemySelected(listener) {
      listeners.enemy.push(listener);
    },
  };
}

export {
  defaultIsometricProjection,
  gridToScreen,
  isometricDepthLayer,
  screenToGrid,
  stableDepth,
} from "./projection";
export type { IsometricProjection, ScreenPosition } from "./projection";
