import {
  comparePositions,
  getOrthogonalNeighbors,
  isBlocked,
  manhattanDistance,
  positionKey,
  samePosition,
} from "./grid";
import { err, ok, type TacticalResult } from "./errors";
import type { TacticalEvent } from "./events";
import type { GridPosition, RoomState } from "./types";
export function reachablePositions(
  state: RoomState,
  start: GridPosition,
  actions: number,
  movingId?: string,
): GridPosition[] {
  const visited = new Map<string, { p: GridPosition; d: number }>();
  const queue = [{ p: start, d: 0 }];
  visited.set(positionKey(start), { p: start, d: 0 });
  for (const item of queue) {
    if (item.d >= actions) continue;
    for (const n of getOrthogonalNeighbors(item.p, state.width, state.height)) {
      if (isBlocked(state, n, movingId)) continue;
      const key = positionKey(n);
      if (!visited.has(key)) {
        visited.set(key, { p: n, d: item.d + 1 });
        queue.push({ p: n, d: item.d + 1 });
      }
    }
  }
  return [...visited.values()]
    .filter((v) => v.d > 0)
    .map((v) => v.p)
    .sort(comparePositions);
}
export function shortestPath(
  state: RoomState,
  start: GridPosition,
  goal: GridPosition,
  movingId?: string,
): GridPosition[] | null {
  if (samePosition(start, goal)) return [];
  if (isBlocked(state, goal, movingId)) return null;
  const queue: GridPosition[] = [start];
  const previous = new Map<string, GridPosition | null>([
    [positionKey(start), null],
  ]);
  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    const neighbors = getOrthogonalNeighbors(current, state.width, state.height)
      .filter((n) => !isBlocked(state, n, movingId))
      .sort(
        (a, b) =>
          manhattanDistance(a, goal) - manhattanDistance(b, goal) ||
          comparePositions(a, b),
      );
    for (const n of neighbors) {
      const key = positionKey(n);
      if (previous.has(key)) continue;
      previous.set(key, current);
      if (samePosition(n, goal)) {
        const path: GridPosition[] = [n];
        let cursor = current;
        while (!samePosition(cursor, start)) {
          path.unshift(cursor);
          const prev = previous.get(positionKey(cursor));
          if (!prev) break;
          cursor = prev;
        }
        return path;
      }
      queue.push(n);
    }
  }
  return null;
}
export function moveCombatant(
  state: RoomState,
  combatantId: string,
  destination: GridPosition,
): TacticalResult<{ state: RoomState; events: TacticalEvent[] }> {
  const hero = state.heroes.find((h) => h.id === combatantId);
  if (!hero) return err("hero-not-found", "Héros introuvable.");
  if (state.phase !== "heroes-turn")
    return err("not-heroes-turn", "Ce n'est pas le tour des héros.");
  if (state.activeHeroId !== combatantId)
    return err("not-active-hero", "Seul le héros actif peut agir.");
  if (hero.actionsRemaining <= 0)
    return err("no-actions", "Aucune action restante.");
  const path = shortestPath(state, hero.position, destination, combatantId);
  if (!path) return err("no-path", "Aucun chemin disponible.");
  if (path.length > hero.actionsRemaining)
    return err("no-actions", "Actions insuffisantes.");
  let next = state;
  const events: TacticalEvent[] = [];
  for (const step of path) {
    const current = next.heroes.find((h) => h.id === combatantId);
    if (!current) return err("hero-not-found", "Héros introuvable.");
    events.push({
      type: "combatant-moved",
      combatantId,
      from: current.position,
      to: step,
      actionCost: 1,
    });
    next = {
      ...next,
      heroes: next.heroes.map((h) =>
        h.id === combatantId
          ? { ...h, position: step, actionsRemaining: h.actionsRemaining - 1 }
          : h,
      ),
    };
  }
  return ok({ state: next, events });
}
