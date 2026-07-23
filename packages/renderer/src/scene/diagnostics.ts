import type { RoomState } from "@gargotte/engine";
import type { IsometricBounds } from "../projection";
import {
  visibleBackSides,
  type GridDimensions,
  type VisibleWallSegment,
} from "../view";
import type { SceneRenderContext } from "./context";

export function setCombatantAssetStatus(
  context: SceneRenderContext,
  combatantId: string,
  status: string,
): void {
  context.canvas.setAttribute(`data-asset-${combatantId}`, status);
}

export function setEnvironmentAssetStatus(
  context: SceneRenderContext,
  key: string,
  status: string,
): void {
  context.canvas.setAttribute(`data-asset-environment-${key}`, status);
}

export function exposeSceneState(
  context: SceneRenderContext,
  state: RoomState,
  wallSegments: VisibleWallSegment[],
  viewedDimensions: GridDimensions,
  bounds: IsometricBounds,
): void {
  context.canvas.dataset.phase = state.phase;
  context.canvas.dataset.turn = String(state.turn);
  context.canvas.dataset.activeHero = state.activeHeroId ?? "";
  context.canvas.dataset.viewRotation = String(context.rotation);
  context.canvas.dataset.roomDimensions = JSON.stringify(
    context.roomDimensions,
  );
  context.canvas.dataset.viewDimensions = JSON.stringify(viewedDimensions);
  context.canvas.dataset.visibleWalls = JSON.stringify(
    visibleBackSides(context.rotation),
  );
  context.canvas.dataset.wallSegments = JSON.stringify(wallSegments);
  context.canvas.dataset.interactables = JSON.stringify(
    state.interactables.map((interactable) => ({
      id: interactable.id,
      interactableId: interactable.interactableId,
      kind: interactable.kind,
      position: interactable.position,
      viewPosition: context.viewPosition(interactable.position),
      stateId: interactable.stateId,
      blocksMovement: interactable.blocksMovement,
      blocksLineOfSight: interactable.blocksLineOfSight,
    })),
  );
  context.canvas.dataset.processedInteractableRequests = JSON.stringify(
    state.processedInteractableRequestIds,
  );
  context.canvas.dataset.nextInteractableInteractionSequence = String(
    state.nextInteractableInteractionSequence,
  );
  context.canvas.dataset.spawnPoints = JSON.stringify(state.spawnPoints);
  context.canvas.dataset.processedSpawnRequests = JSON.stringify(
    state.processedSpawnRequestIds,
  );
  context.canvas.dataset.nextEnemyInstanceSequence = String(
    state.nextEnemyInstanceSequence,
  );
  context.canvas.dataset.brouhahaLevel = String(state.brouhaha.level);
  context.canvas.dataset.brouhahaHistory = JSON.stringify(
    state.brouhaha.history,
  );
  context.canvas.dataset.processedBrouhahaRequests = JSON.stringify(
    state.brouhaha.processedRequestIds,
  );
  context.canvas.dataset.nextBrouhahaResolutionSequence = String(
    state.brouhaha.nextResolutionSequence,
  );
  context.canvas.dataset.heroes = JSON.stringify(
    state.heroes.map((hero) => ({
      id: hero.id,
      position: hero.position,
      viewPosition: context.viewPosition(hero.position),
      hp: hero.hp,
      actionsRemaining: hero.actionsRemaining,
      activationCompleted: hero.activationCompleted,
    })),
  );
  context.canvas.dataset.enemies = JSON.stringify(
    state.enemies.map((enemy) => ({
      id: enemy.id,
      creatureId: enemy.creatureId,
      position: enemy.position,
      viewPosition: context.viewPosition(enemy.position),
      hp: enemy.hp,
      alive: enemy.alive,
    })),
  );
  context.canvas.dataset.projection = JSON.stringify(context.projection);
  context.canvas.dataset.bounds = JSON.stringify(bounds);
  context.canvas.dataset.assetCacheSize = String(context.assets.cacheSize);
}
