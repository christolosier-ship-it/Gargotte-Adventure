import {
  Application,
  Container,
  Graphics,
  Polygon,
  Sprite,
  Text,
} from "pixi.js";
import { IsometricAssetRegistry, type RuntimeAsset } from "./assets";
import type {
  Combatant,
  GridPosition,
  HeroState,
  RoomState,
} from "@gargotte/engine";
import tokens from "../../../design/isometric/tokens.json";
import {
  buildRoomProjection,
  calculateIsometricGridBounds,
  defaultCameraMargins,
  fitIsometricCamera,
  gridToScreen,
  isometricPlaceholderTokenGeometry,
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

type TileState =
  "base" | "alternate" | "reachable" | "selected" | "attackable" | "blocked";
type SceneLayers = Record<
  "backdrop" | "floor" | "object" | "foreground" | "interface",
  Container
>;

const combatantSpriteAssets: Readonly<Record<string, string>> = {
  brunhilda: "character.brunhilda",
  "gobelin-bricoleur": "character.gobelin-bricoleur",
};
const characterSpriteTargetHeight = 96;
export function characterSpriteScale(asset: RuntimeAsset): number {
  return characterSpriteTargetHeight / asset.dimensions.height;
}

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
const combatantHitArea = new Polygon([-48, -96, 48, -96, 48, 12, -48, 12]);
const tileStyle: Record<TileState, { color: number; alpha: number }> = {
  base: { color: tokenNumber(tokens.color.primitive.stoneDark), alpha: 1 },
  alternate: { color: tokenNumber(tokens.color.primitive.stoneMid), alpha: 1 },
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
function samePosition(a: GridPosition, b: GridPosition): boolean {
  return a.column === b.column && a.row === b.row;
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

  const assets = new IsometricAssetRegistry();
  app.canvas.dataset.assetManifest = "loading";
  const manifestReady = assets.loadManifest();
  void manifestReady.then(async (loaded) => {
    app.canvas.dataset.assetManifest = loaded ? "loaded" : "fallback";
    await Promise.allSettled([
      assets.textureFor("tile.fallback"),
      assets.textureFor("wall.fallback", "south-east"),
      assets.textureFor("prop.fallback-obstacle"),
      assets.textureFor("fx.impact-test"),
      assets.textureFor("missing.asset"),
    ]);
    app.canvas.dataset.assetCacheSize = String(assets.cacheSize);
  });
  const stage = new Container();
  app.stage.addChild(stage);
  const layers: SceneLayers = {
    backdrop: new Container(),
    floor: new Container(),
    object: new Container(),
    foreground: new Container(),
    interface: new Container(),
  };
  for (const [name, layer] of Object.entries(layers)) {
    layer.label = `layer:${name}`;
    layer.sortableChildren = true;
    stage.addChild(layer);
  }
  let currentProjection: IsometricProjection = buildRoomProjection({
    width: 1,
    height: 1,
  });
  let currentBounds = calculateIsometricGridBounds(
    { width: 1, height: 1 },
    currentProjection,
  );
  let renderGeneration = 0;
  const listeners = {
    cell: [] as ((position: GridPosition) => void)[],
    hero: [] as ((id: string) => void)[],
    enemy: [] as ((id: string) => void)[],
  };

  function setCombatantAssetStatus(combatantId: string, status: string): void {
    app.canvas.setAttribute(`data-asset-${combatantId}`, status);
  }

  function clearLayers(): void {
    for (const layer of Object.values(layers))
      for (const child of layer.removeChildren())
        child.destroy({ children: true });
  }
  function projectedPosition(position: GridPosition) {
    return gridToScreen(position, currentProjection);
  }

  function tileState(
    state: RoomState,
    position: GridPosition,
    reachable: boolean,
    selected: boolean,
    attackable: boolean,
  ): TileState {
    if (state.obstacles.some((obstacle) => samePosition(obstacle, position)))
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
    cell.zIndex = stableDepth(screen.y, currentProjection.tileHeight, 0);
    cell.on("pointertap", () =>
      listeners.cell.forEach((listener) => listener(position)),
    );
    layers.floor.addChild(cell);
    if (tileKind === "blocked") {
      const obstacle = new Graphics()
        .roundRect(-22, -46, 44, 58, 8)
        .fill({
          color: tokenNumber(tokens.color.primitive.woodMid),
          alpha: 0.95,
        })
        .stroke({ color: tokenNumber(tokens.color.primitive.gold), width: 3 });
      obstacle.position.set(screen.x, screen.y + 6);
      obstacle.zIndex = stableDepth(
        screen.y,
        currentProjection.tileHeight,
        100,
      );
      layers.object.addChild(obstacle);
    }
  }

  function drawToken(
    combatant: Combatant | HeroState,
    active: boolean,
    attackable: boolean,
    tieBreaker: number,
    generation: number,
  ): void {
    const screen = projectedPosition(combatant.position);
    const token = new Container();
    token.eventMode = "static";
    token.cursor = "pointer";
    token.hitArea = combatantHitArea;
    token.label = `${combatant.kind}:${combatant.id}`;
    token.zIndex = stableDepth(
      screen.y,
      currentProjection.tileHeight,
      200 + tieBreaker,
    );
    token.on("pointertap", () =>
      combatant.kind === "hero"
        ? listeners.hero.forEach((listener) => listener(combatant.id))
        : listeners.enemy.forEach((listener) => listener(combatant.id)),
    );
    const shadow = new Graphics()
      .ellipse(
        0,
        isometricPlaceholderTokenGeometry.shadowCenterY,
        isometricPlaceholderTokenGeometry.shadowRadiusX,
        isometricPlaceholderTokenGeometry.shadowRadiusY,
      )
      .fill({ color: 0x000000, alpha: tokens.opacity.shadow });
    const body = new Graphics()
      .circle(
        0,
        isometricPlaceholderTokenGeometry.bodyCenterY,
        isometricPlaceholderTokenGeometry.bodyRadius,
      )
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
    label.position.set(0, isometricPlaceholderTokenGeometry.labelCenterY);
    const hp = new Text({
      text: `${combatant.hp}/${combatant.maxHp}`,
      style: { fill: 0xf8ecd2, fontSize: 12, fontWeight: "700" },
    });
    hp.anchor.set(0.5);
    hp.position.set(0, isometricPlaceholderTokenGeometry.hpCenterY);
    token.addChild(shadow, body, label, hp);
    token.position.set(screen.x, screen.y);
    layers.object.addChild(token);

    const assetId = combatantSpriteAssets[combatant.id];
    if (!assetId) return;
    setCombatantAssetStatus(combatant.id, "loading");
    void (async () => {
      const manifestLoaded = await manifestReady;
      if (generation !== renderGeneration || token.destroyed) return;
      if (!manifestLoaded) {
        setCombatantAssetStatus(combatant.id, "manifest-missing");
        return;
      }
      const result = await assets.textureFor(assetId, "south-east");
      if (generation !== renderGeneration || token.destroyed) return;
      if (!result.ok) {
        setCombatantAssetStatus(combatant.id, result.reason);
        return;
      }
      if (!result.texture) {
        setCombatantAssetStatus(combatant.id, "placeholder");
        return;
      }
      const sprite = new Sprite(result.texture);
      sprite.label = `sprite:${combatant.id}`;
      sprite.eventMode = "none";
      sprite.anchor.set(result.asset.anchor.x, result.asset.anchor.y);
      const scale = characterSpriteScale(result.asset);
      sprite.scale.set(result.mirrored ? -scale : scale, scale);
      sprite.position.set(0, 0);
      token.addChildAt(sprite, 1);
      body.visible = false;
      label.visible = false;
      setCombatantAssetStatus(combatant.id, "webp");
    })().catch((error: unknown) => {
      if (generation !== renderGeneration || token.destroyed) return;
      console.error(`[assets] sprite échoué: ${combatant.id}`, error);
      setCombatantAssetStatus(combatant.id, "texture-error");
    });
  }

  function drawWalls(state: RoomState, focus: GridPosition[]): void {
    const faded = (position: GridPosition) =>
      focus.some((candidate) => samePosition(candidate, position));
    for (let column = 0; column < state.width; column += 1)
      drawWall(
        { column, row: state.height - 1 },
        "south-east",
        faded({ column, row: state.height - 1 }),
      );
    for (let row = 0; row < state.height; row += 1)
      drawWall({ column: 0, row }, "north-east", faded({ column: 0, row }));
  }
  function drawWall(
    position: GridPosition,
    orientation: "south-east" | "north-east",
    faded: boolean,
  ): void {
    const screen = projectedPosition(position);
    const w = isometricTileGeometry.halfTileWidth;
    const h = tokens.geometry.wallHeight;
    const t = isometricTileGeometry.halfTileHeight;
    const points =
      orientation === "south-east"
        ? [-w, 0, 0, t, 0, t - h, -w, -h]
        : [w, 0, 0, t, 0, t - h, w, -h];
    const wall = new Graphics()
      .poly(points)
      .fill({
        color: tokenNumber(tokens.color.primitive.woodDark),
        alpha: faded ? 0.3 : 0.82,
      })
      .stroke({
        color: tokenNumber(tokens.color.primitive.gold),
        width: 2,
        alpha: faded ? 0.45 : 0.9,
      });
    wall.eventMode = "none";
    wall.label = `wall:${orientation}:${position.column},${position.row}`;
    wall.position.set(screen.x, screen.y);
    wall.zIndex = stableDepth(screen.y, currentProjection.tileHeight, 700);
    layers.foreground.addChild(wall);
  }

  function renderRoom(
    state: RoomState,
    highlights: TacticalHighlights = { reachable: [], attackable: [] },
  ): void {
    clearLayers();
    renderGeneration += 1;
    currentProjection = buildRoomProjection(state);
    currentBounds = calculateIsometricGridBounds(state, currentProjection);
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
    app.canvas.dataset.projection = JSON.stringify(currentProjection);
    app.canvas.dataset.bounds = JSON.stringify(currentBounds);
    const backdrop = new Graphics()
      .roundRect(
        currentBounds.minX - defaultCameraMargins.left,
        currentBounds.minY - defaultCameraMargins.top,
        currentBounds.width +
          defaultCameraMargins.left +
          defaultCameraMargins.right,
        currentBounds.height +
          defaultCameraMargins.top +
          defaultCameraMargins.bottom,
        28,
      )
      .fill({ color: 0x2a1d18 })
      .stroke({ color: 0x806044, width: 5 });
    layers.backdrop.addChild(backdrop);
    const title = new Text({
      text:
        state.phase === "victory"
          ? "VICTOIRE"
          : state.phase === "defeat"
            ? "DÉFAITE"
            : "BASTOGNAC · SALLE TACTIQUE",
      style: { fill: 0xf1c86f, fontSize: 22, fontWeight: "700" },
    });
    title.position.set(currentBounds.minX - 46, currentBounds.minY - 62);
    layers.interface.addChild(title);
    const attackablePositions = state.enemies
      .filter(
        (enemy) => enemy.alive && highlights.attackable.includes(enemy.id),
      )
      .map((enemy) => enemy.position);
    for (let row = 0; row < state.height; row += 1)
      for (let column = 0; column < state.width; column += 1) {
        const position = { column, row };
        drawTile(
          position,
          tileState(
            state,
            position,
            highlights.reachable.some((p) => samePosition(p, position)),
            state.heroes.some(
              (hero) =>
                hero.alive &&
                hero.id === state.activeHeroId &&
                samePosition(hero.position, position),
            ),
            attackablePositions.some((p) => samePosition(p, position)),
          ),
        );
      }
    state.heroes
      .filter((candidate) => candidate.alive)
      .forEach((hero, index) =>
        drawToken(
          hero,
          hero.id === state.activeHeroId,
          false,
          index,
          renderGeneration,
        ),
      );
    state.enemies
      .filter((candidate) => candidate.alive)
      .forEach((enemy, index) =>
        drawToken(
          enemy,
          false,
          highlights.attackable.includes(enemy.id),
          index,
          renderGeneration,
        ),
      );
    const active = state.heroes.find((hero) => hero.id === state.activeHeroId);
    drawWalls(state, [
      ...(active ? [active.position] : []),
      ...highlights.reachable,
      ...attackablePositions,
    ]);
    host.dataset.displayObjects = String(
      Object.values(layers).reduce(
        (sum, layer) => sum + layer.children.length,
        0,
      ),
    );
    resize();
  }

  function resize(): void {
    const camera = fitIsometricCamera(currentBounds, {
      width: host.clientWidth || 1,
      height: host.clientHeight || 1,
    });
    stage.scale.set(camera.scale);
    stage.position.set(camera.offsetX, camera.offsetY);
    app.canvas.dataset.camera = JSON.stringify(camera);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  return {
    destroy() {
      observer.disconnect();
      clearLayers();
      assets.destroy();
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
  buildRoomProjection,
  calculateIsometricGridBounds,
  defaultCameraMargins,
  defaultIsometricProjection,
  fitIsometricCamera,
  gridToScreen,
  isometricPlaceholderTokenGeometry,
  screenToGrid,
  stableDepth,
} from "./projection";
export type {
  CameraFit,
  CameraMargins,
  IsometricBounds,
  IsometricProjection,
  ScreenPosition,
  Viewport,
} from "./projection";
export {
  IsometricAssetRegistry,
  assetBudgets,
  validateRuntimeAssetManifest,
} from "./assets";
export type {
  AssetOrientation,
  AssetResolveResult,
  RuntimeAsset,
  RuntimeAssetManifest,
} from "./assets";
