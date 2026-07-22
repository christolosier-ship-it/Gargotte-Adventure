import { Application, Container } from "pixi.js";
import type { GridPosition, RoomState } from "@gargotte/engine";
import { IsometricAssetRegistry } from "./assets";
import type { TabletopAssetCatalog } from "./catalog";
import {
  buildRoomProjection,
  calculateIsometricGridBounds,
  fitIsometricCamera,
  gridToScreen,
  type IsometricBounds,
  type IsometricProjection,
} from "./projection";
import { exposeSceneState } from "./scene/diagnostics";
import type {
  SceneLayers,
  SceneListeners,
  SceneRenderContext,
} from "./scene/context";
import { renderRoomScene } from "./scene/room";
import type { TabletopRenderer, TacticalHighlights } from "./types";
import {
  logicalToView,
  nextCameraRotation,
  viewDimensions,
  visibleWallSegments,
  type CameraRotation,
  type GridDimensions,
} from "./view";

const emptyHighlights: TacticalHighlights = { reachable: [], attackable: [] };

function createLayers(stage: Container): SceneLayers {
  const layers: SceneLayers = {
    backdrop: new Container(),
    floor: new Container(),
    backWall: new Container(),
    object: new Container(),
    interface: new Container(),
  };
  for (const [name, layer] of Object.entries(layers)) {
    layer.label = `layer:${name}`;
    layer.sortableChildren = true;
    stage.addChild(layer);
  }
  return layers;
}

export async function createTabletopRenderer(
  host: HTMLElement,
  catalog: TabletopAssetCatalog,
): Promise<TabletopRenderer> {
  const app = new Application();
  await app.init({
    resizeTo: host,
    antialias: true,
    background: "#17100d",
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  app.canvas.setAttribute("aria-label", catalog.canvasLabel);
  app.canvas.setAttribute("role", "img");
  app.canvas.tabIndex = 0;
  host.replaceChildren(app.canvas);

  const assets = new IsometricAssetRegistry();
  app.canvas.dataset.assetManifest = "loading";
  const manifestReady = assets.loadManifest();
  void manifestReady.then(async (loaded) => {
    app.canvas.dataset.assetManifest = loaded ? "loaded" : "fallback";
    if (loaded)
      await Promise.allSettled(
        (catalog.preload ?? []).map((request) =>
          assets.textureFor(request.id, request.orientation ?? "omni"),
        ),
      );
    app.canvas.dataset.assetCacheSize = String(assets.cacheSize);
  });

  const stage = new Container();
  app.stage.addChild(stage);
  const layers = createLayers(stage);
  const listeners: SceneListeners = { cell: [], hero: [], enemy: [] };

  let currentRotation: CameraRotation = 0;
  let currentRoomDimensions: GridDimensions = { width: 1, height: 1 };
  let currentProjection: IsometricProjection = buildRoomProjection({
    width: 1,
    height: 1,
  });
  let currentBounds: IsometricBounds = calculateIsometricGridBounds(
    { width: 1, height: 1 },
    currentProjection,
  );
  let currentState: RoomState | null = null;
  let currentHighlights: TacticalHighlights = emptyHighlights;
  let renderGeneration = 0;

  function clearLayers(): void {
    for (const layer of Object.values(layers))
      for (const child of layer.removeChildren())
        child.destroy({ children: true });
  }

  function createContext(generation: number): SceneRenderContext {
    const roomDimensions = currentRoomDimensions;
    const rotation = currentRotation;
    const projection = currentProjection;
    const viewPosition = (position: GridPosition): GridPosition =>
      logicalToView(position, roomDimensions, rotation);
    return {
      canvas: app.canvas,
      assets,
      catalog,
      layers,
      projection,
      roomDimensions,
      rotation,
      generation,
      manifestReady,
      listeners,
      isCurrent(container) {
        return generation === renderGeneration && !container?.destroyed;
      },
      viewPosition,
      projectedPosition(position) {
        return gridToScreen(viewPosition(position), projection);
      },
    };
  }

  function renderRoom(
    state: RoomState,
    highlights: TacticalHighlights = emptyHighlights,
  ): void {
    currentState = state;
    currentHighlights = highlights;
    clearLayers();
    renderGeneration += 1;
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
    const context = createContext(renderGeneration);
    exposeSceneState(
      context,
      state,
      wallSegments,
      viewedDimensions,
      currentBounds,
    );
    renderRoomScene(context, state, highlights, currentBounds, wallSegments);
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
