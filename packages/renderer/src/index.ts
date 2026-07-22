import {
  Application,
  Container,
  Graphics,
  Polygon,
  Sprite,
  Text,
} from "pixi.js";
import {
  IsometricAssetRegistry,
  type AssetOrientation,
  type RuntimeAsset,
} from "./assets";
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
import {
  logicalToView,
  nextCameraRotation,
  viewDimensions,
  visibleBackSides,
  visibleWallSegments,
  type CameraRotation,
  type GridDimensions,
  type VisibleWallSegment,
} from "./view";

export interface TacticalHighlights {
  reachable: GridPosition[];
  attackable: string[];
}

export interface TabletopRenderer {
  destroy(): void;
  setExpeditionActive(active: boolean): void;
  renderRoom(state: RoomState, highlights?: TacticalHighlights): void;
  rotateCamera(): CameraRotation;
  getCameraRotation(): CameraRotation;
  onCellSelected(listener: (position: GridPosition) => void): void;
  onHeroSelected(listener: (heroId: string) => void): void;
  onEnemySelected(listener: (enemyId: string) => void): void;
}

type TileState =
  | "base"
  | "alternate"
  | "reachable"
  | "selected"
  | "attackable"
  | "blocked";
type SceneLayers = Record<
  | "backdrop"
  | "floor"
  | "backWall"
  | "object"
  | "foreground"
  | "interface",
  Container
>;

type EnvironmentStatusKey =
  | "tile-bastognac-floor-a"
  | "tile-bastognac-floor-b"
  | "wall-bastognac-south-east"
  | "wall-bastognac-north-east"
  | "prop-bastognac-barrel";

const emptyHighlights: TacticalHighlights = { reachable: [], attackable: [] };
const combatantSpriteAssets: Readonly<Record<string, string>> = {
  brunhilda: "character.brunhilda",
  "gobelin-bricoleur": "character.gobelin-bricoleur",
};

const environmentAssetIds = {
  floorA: "tile.bastognac-floor-a",
  floorB: "tile.bastognac-floor-b",
  wall: "wall.bastognac",
  barrel: "prop.bastognac-barrel",
} as const;

const characterSpriteTargetHeight = 96;
const barrelSpriteTargetHeight = 72;
const wallSpriteScale = 0.58;

export function characterSpriteScale(asset: RuntimeAsset): number {
  return characterSpriteTargetHeight / asset.dimensions.height;
}

export function environmentTileAssetId(position: GridPosition): string {
  return (position.column + position.row) % 2 === 0
    ? environmentAssetIds.floorA
    : environmentAssetIds.floorB;
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
  blocked: {
    color: tokenNumber(tokens.color.primitive.woodMid),
    alpha: 0.5,
  },
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

function environmentStatusKeyForTile(assetId: string): EnvironmentStatusKey {
  return assetId === environmentAssetIds.floorA
    ? "tile-bastognac-floor-a"
    : "tile-bastognac-floor-b";
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
      assets.textureFor(environmentAssetIds.floorA),
      assets.textureFor(environmentAssetIds.floorB),
      assets.textureFor(environmentAssetIds.wall, "south-east"),
      assets.textureFor(environmentAssetIds.wall, "north-east"),
      assets.textureFor(environmentAssetIds.barrel),
      assets.textureFor("missing.asset"),
    ]);
    app.canvas.dataset.assetCacheSize = String(assets.cacheSize);
  });

  const stage = new Container();
  app.stage.addChild(stage);
  const layers: SceneLayers = {
    backdrop: new Container(),
    floor: new Container(),
    backWall: new Container(),
    object: new Container(),
    foreground: new Container(),
    interface: new Container(),
  };
  for (const [name, layer] of Object.entries(layers)) {
    layer.label = `layer:${name}`;
    layer.sortableChildren = true;
    stage.addChild(layer);
  }

  let currentRotation: CameraRotation = 0;
  let currentRoomDimensions: GridDimensions = { width: 1, height: 1 };
  let currentProjection: IsometricProjection = buildRoomProjection({
    width: 1,
    height: 1,
  });
  let currentBounds = calculateIsometricGridBounds(
    { width: 1, height: 1 },
    currentProjection,
  );
  let currentState: RoomState | null = null;
  let currentHighlights: TacticalHighlights = emptyHighlights;
  let renderGeneration = 0;
  const listeners = {
    cell: [] as ((position: GridPosition) => void)[],
    hero: [] as ((id: string) => void)[],
    enemy: [] as ((id: string) => void)[],
  };

  function setCombatantAssetStatus(combatantId: string, status: string): void {
    app.canvas.setAttribute(`data-asset-${combatantId}`, status);
  }

  function setEnvironmentAssetStatus(
    key: EnvironmentStatusKey,
    status: string,
  ): void {
    app.canvas.setAttribute(`data-asset-environment-${key}`, status);
  }

  function clearLayers(): void {
    for (const layer of Object.values(layers))
      for (const child of layer.removeChildren())
        child.destroy({ children: true });
  }

  function viewPosition(position: GridPosition): GridPosition {
    return logicalToView(position, currentRoomDimensions, currentRotation);
  }

  function projectedPosition(position: GridPosition) {
    return gridToScreen(viewPosition(position), currentProjection);
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

  async function addEnvironmentSprite(options: {
    assetId: string;
    orientation?: AssetOrientation;
    statusKey: EnvironmentStatusKey;
    container: Container;
    generation: number;
    insertAt: number;
    configure: (sprite: Sprite, asset: RuntimeAsset, mirrored: boolean) => void;
    onLoaded?: () => void;
  }): Promise<void> {
    const manifestLoaded = await manifestReady;
    if (options.generation !== renderGeneration || options.container.destroyed)
      return;
    if (!manifestLoaded) {
      setEnvironmentAssetStatus(options.statusKey, "manifest-missing");
      return;
    }
    const result = await assets.textureFor(
      options.assetId,
      options.orientation ?? "omni",
    );
    if (options.generation !== renderGeneration || options.container.destroyed)
      return;
    if (!result.ok) {
      setEnvironmentAssetStatus(options.statusKey, result.reason);
      return;
    }
    if (!result.texture) {
      setEnvironmentAssetStatus(options.statusKey, "placeholder");
      return;
    }
    const sprite = new Sprite(result.texture);
    sprite.label = `asset:${options.assetId}:${options.orientation ?? "omni"}`;
    sprite.eventMode = "none";
    sprite.anchor.set(result.asset.anchor.x, result.asset.anchor.y);
    options.configure(sprite, result.asset, result.mirrored);
    options.container.addChildAt(
      sprite,
      Math.min(options.insertAt, options.container.children.length),
    );
    options.onLoaded?.();
    setEnvironmentAssetStatus(options.statusKey, result.asset.format);
    app.canvas.dataset.assetCacheSize = String(assets.cacheSize);
  }

  function drawTile(
    position: GridPosition,
    tileKind: TileState,
    generation: number,
  ): void {
    const screen = projectedPosition(position);
    const baseKind =
      (position.column + position.row) % 2 === 0 ? "base" : "alternate";
    const baseStyle = tileStyle[baseKind];
    const cell = new Container();
    cell.eventMode = "static";
    cell.cursor = "pointer";
    cell.hitArea = tileHitArea;
    cell.label = `cell:${position.column},${position.row}`;
    cell.position.set(screen.x, screen.y);
    cell.zIndex = stableDepth(screen.y, currentProjection.tileHeight, 0);
    cell.on("pointertap", () =>
      listeners.cell.forEach((listener) => listener(position)),
    );

    const fallback = new Graphics()
      .poly(diamond())
      .fill({ color: baseStyle.color, alpha: baseStyle.alpha })
      .stroke({ color: tokenNumber(tokens.color.primitive.line), width: 2 });
    fallback.eventMode = "none";
    cell.addChild(fallback);

    if (tileKind !== "base" && tileKind !== "alternate") {
      const overlayStyle = tileStyle[tileKind];
      const overlay = new Graphics()
        .poly(diamond())
        .fill({ color: overlayStyle.color, alpha: overlayStyle.alpha })
        .stroke({
          color: overlayStyle.color,
          width: tileKind === "selected" || tileKind === "attackable" ? 4 : 2,
          alpha: Math.min(1, overlayStyle.alpha + 0.2),
        });
      overlay.eventMode = "none";
      overlay.label = `overlay:${tileKind}:${position.column},${position.row}`;
      cell.addChild(overlay);
    }

    layers.floor.addChild(cell);
    const assetId = environmentTileAssetId(position);
    const statusKey = environmentStatusKeyForTile(assetId);
    setEnvironmentAssetStatus(statusKey, "loading");
    void addEnvironmentSprite({
      assetId,
      statusKey,
      container: cell,
      generation,
      insertAt: 1,
      configure(sprite, asset, mirrored) {
        const scaleX = currentProjection.tileWidth / asset.dimensions.width;
        const scaleY = currentProjection.tileHeight / asset.dimensions.height;
        sprite.scale.set(mirrored ? -scaleX : scaleX, scaleY);
        sprite.position.set(0, 0);
      },
    }).catch((error: unknown) => {
      if (generation !== renderGeneration || cell.destroyed) return;
      console.error(`[assets] sol échoué: ${assetId}`, error);
      setEnvironmentAssetStatus(statusKey, "texture-error");
    });

    if (tileKind === "blocked") drawObstacle(position, generation);
  }

  function drawObstacle(position: GridPosition, generation: number): void {
    const screen = projectedPosition(position);
    const obstacle = new Container();
    obstacle.eventMode = "none";
    obstacle.label = `obstacle:${position.column},${position.row}`;
    obstacle.position.set(screen.x, screen.y);
    obstacle.zIndex = stableDepth(screen.y, currentProjection.tileHeight, 100);
    const fallback = new Graphics()
      .roundRect(-22, -46, 44, 58, 8)
      .fill({
        color: tokenNumber(tokens.color.primitive.woodMid),
        alpha: 0.95,
      })
      .stroke({ color: tokenNumber(tokens.color.primitive.gold), width: 3 });
    fallback.eventMode = "none";
    obstacle.addChild(fallback);
    layers.object.addChild(obstacle);

    setEnvironmentAssetStatus("prop-bastognac-barrel", "loading");
    void addEnvironmentSprite({
      assetId: environmentAssetIds.barrel,
      statusKey: "prop-bastognac-barrel",
      container: obstacle,
      generation,
      insertAt: 1,
      configure(sprite, asset, mirrored) {
        const scale = barrelSpriteTargetHeight / asset.dimensions.height;
        sprite.scale.set(mirrored ? -scale : scale, scale);
        sprite.position.set(0, 4);
      },
      onLoaded() {
        fallback.visible = false;
      },
    }).catch((error: unknown) => {
      if (generation !== renderGeneration || obstacle.destroyed) return;
      console.error("[assets] tonneau Bastognac échoué", error);
      setEnvironmentAssetStatus("prop-bastognac-barrel", "texture-error");
    });
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

  function wallFallbackPoints(segment: VisibleWallSegment): number[] {
    const w = isometricTileGeometry.halfTileWidth;
    const h = tokens.geometry.wallHeight;
    const t = isometricTileGeometry.halfTileHeight;
    return segment.viewSide === "north"
      ? [0, -t, w, 0, w, -h, 0, -t - h]
      : [0, -t, -w, 0, -w, -h, 0, -t - h];
  }

  function drawWall(segment: VisibleWallSegment, generation: number): void {
    const screen = gridToScreen(segment.viewPosition, currentProjection);
    const wall = new Container();
    wall.eventMode = "none";
    wall.label = `wall:${segment.id}:${segment.viewSide}`;
    wall.position.set(screen.x, screen.y);
    wall.zIndex = stableDepth(screen.y, currentProjection.tileHeight, segment.index);
    const fallback = new Graphics()
      .poly(wallFallbackPoints(segment))
      .fill({
        color: tokenNumber(tokens.color.primitive.woodDark),
        alpha: 0.82,
      })
      .stroke({
        color: tokenNumber(tokens.color.primitive.gold),
        width: 2,
        alpha: 0.9,
      });
    fallback.eventMode = "none";
    wall.addChild(fallback);
    layers.backWall.addChild(wall);

    const statusKey: EnvironmentStatusKey =
      segment.orientation === "south-east"
        ? "wall-bastognac-south-east"
        : "wall-bastognac-north-east";
    setEnvironmentAssetStatus(statusKey, "loading");
    void addEnvironmentSprite({
      assetId: environmentAssetIds.wall,
      orientation: segment.orientation,
      statusKey,
      container: wall,
      generation,
      insertAt: 1,
      configure(sprite, _asset, mirrored) {
        const direction = segment.viewSide === "north" ? 1 : -1;
        sprite.scale.set(
          mirrored ? -wallSpriteScale : wallSpriteScale,
          wallSpriteScale,
        );
        sprite.position.set(
          direction * isometricTileGeometry.halfTileWidth * 0.5,
          -isometricTileGeometry.halfTileHeight * 0.5,
        );
      },
      onLoaded() {
        fallback.visible = false;
      },
    }).catch((error: unknown) => {
      if (generation !== renderGeneration || wall.destroyed) return;
      console.error(`[assets] mur Bastognac échoué: ${segment.id}`, error);
      setEnvironmentAssetStatus(statusKey, "texture-error");
    });
  }

  function exposeSceneState(
    state: RoomState,
    wallSegments: VisibleWallSegment[],
    viewedDimensions: GridDimensions,
  ): void {
    app.canvas.dataset.phase = state.phase;
    app.canvas.dataset.turn = String(state.turn);
    app.canvas.dataset.activeHero = state.activeHeroId ?? "";
    app.canvas.dataset.viewRotation = String(currentRotation);
    app.canvas.dataset.roomDimensions = JSON.stringify(currentRoomDimensions);
    app.canvas.dataset.viewDimensions = JSON.stringify(viewedDimensions);
    app.canvas.dataset.visibleWalls = JSON.stringify(
      visibleBackSides(currentRotation),
    );
    app.canvas.dataset.wallSegments = JSON.stringify(wallSegments);
    app.canvas.dataset.heroes = JSON.stringify(
      state.heroes.map((hero) => ({
        id: hero.id,
        position: hero.position,
        viewPosition: viewPosition(hero.position),
        hp: hero.hp,
        actionsRemaining: hero.actionsRemaining,
        activationCompleted: hero.activationCompleted,
      })),
    );
    app.canvas.dataset.enemies = JSON.stringify(
      state.enemies.map((enemy) => ({
        id: enemy.id,
        position: enemy.position,
        viewPosition: viewPosition(enemy.position),
        hp: enemy.hp,
        alive: enemy.alive,
      })),
    );
    app.canvas.dataset.projection = JSON.stringify(currentProjection);
    app.canvas.dataset.bounds = JSON.stringify(currentBounds);
  }

  function renderRoom(
    state: RoomState,
    highlights: TacticalHighlights = emptyHighlights,
  ): void {
    currentState = state;
    currentHighlights = highlights;
    clearLayers();
    renderGeneration += 1;
    const generation = renderGeneration;
    currentRoomDimensions = { width: state.width, height: state.height };
    const viewedDimensions = viewDimensions(
      currentRoomDimensions,
      currentRotation,
    );
    currentProjection = buildRoomProjection(viewedDimensions);
    currentBounds = calculateIsometricGridBounds(
      viewedDimensions,
      currentProjection,
    );
    const wallSegments = visibleWallSegments(
      currentRoomDimensions,
      currentRotation,
    );
    exposeSceneState(state, wallSegments, viewedDimensions);

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
            highlights.reachable.some((candidate) =>
              samePosition(candidate, position),
            ),
            state.heroes.some(
              (hero) =>
                hero.alive &&
                hero.id === state.activeHeroId &&
                samePosition(hero.position, position),
            ),
            attackablePositions.some((candidate) =>
              samePosition(candidate, position),
            ),
          ),
          generation,
        );
      }

    wallSegments.forEach((segment) => drawWall(segment, generation));
    state.heroes
      .filter((candidate) => candidate.alive)
      .forEach((hero, index) =>
        drawToken(
          hero,
          hero.id === state.activeHeroId,
          false,
          index,
          generation,
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
          generation,
        ),
      );

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
    rotateCamera() {
      currentRotation = nextCameraRotation(currentRotation);
      if (currentState) renderRoom(currentState, currentHighlights);
      return currentRotation;
    },
    getCameraRotation() {
      return currentRotation;
    },
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
  logicalToView,
  nextCameraRotation,
  roomWallSegments,
  transformRoomSide,
  viewDimensions,
  viewToLogical,
  visibleBackSides,
  visibleWallSegments,
} from "./view";
export type {
  BackWallViewSide,
  CameraRotation,
  GridDimensions,
  PhysicalWallSegment,
  RoomSide,
  VisibleWallSegment,
  WallAssetOrientation,
} from "./view";
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
