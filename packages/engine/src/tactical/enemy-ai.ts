import { enemyAttack } from "./combat";
import { comparePositions, manhattanDistance, isBlocked } from "./grid";
import { shortestPath } from "./movement";
import type { EnemyDecisionExplanation, TacticalEvent } from "./events";
import type { GridPosition, RoomState } from "./types";
export function runEnemyTurn(state: RoomState): {
  state: RoomState;
  events: TacticalEvent[];
} {
  let next = state;
  const events: TacticalEvent[] = [];
  for (const enemy of [...next.enemies]
    .filter((e) => e.alive)
    .sort((a, b) => a.id.localeCompare(b.id))) {
    const decision = chooseEnemyDecision(next, enemy.id);
    events.push({
      type: "enemy-decision",
      enemyId: enemy.id,
      explanation: decision,
    });
    if (decision.action === "attack" || decision.action === "move-and-attack") {
      const hit = decision.targetId
        ? enemyAttack(next, enemy.id, decision.targetId)
        : null;
      if (hit) {
        next = hit.state;
        events.push(...hit.events);
      }
    } else if (decision.action === "move" && decision.path[0]) {
      const current = next.enemies.find((e) => e.id === enemy.id)!;
      next = {
        ...next,
        enemies: next.enemies.map((e) =>
          e.id === enemy.id ? { ...e, position: decision.path[0]! } : e,
        ),
      };
      events.push({
        type: "combatant-moved",
        combatantId: enemy.id,
        from: current.position,
        to: decision.path[0],
        actionCost: 1,
      });
      const after = chooseEnemyDecision(next, enemy.id);
      if (after.action === "attack" && after.targetId) {
        const hit = enemyAttack(next, enemy.id, after.targetId);
        if (hit) {
          next = hit.state;
          events.push(...hit.events);
        }
      }
    }
  }
  return { state: next, events };
}
export function chooseEnemyDecision(
  state: RoomState,
  enemyId: string,
): EnemyDecisionExplanation {
  const enemy = state.enemies.find((e) => e.id === enemyId);
  const heroes = state.heroes
    .filter((h) => h.alive)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!enemy || heroes.length === 0)
    return {
      enemyId,
      targetId: null,
      action: "wait",
      reason: "aucune cible",
      path: [],
    };
  for (const h of heroes) {
    if (manhattanDistance(enemy.position, h.position) <= enemy.range)
      return {
        enemyId,
        targetId: h.id,
        action: "attack",
        reason: "cible en portée",
        path: [],
      };
  }
  const plans: {
    targetId: string;
    cell: GridPosition;
    path: GridPosition[];
  }[] = [];
  for (const h of heroes) {
    const cells: GridPosition[] = [];
    for (let c = 0; c < state.width; c += 1)
      for (let r = 0; r < state.height; r += 1) {
        const p = { column: c, row: r };
        if (
          manhattanDistance(p, h.position) <= enemy.range &&
          !isBlocked(state, p, enemy.id)
        )
          cells.push(p);
      }
    for (const cell of cells.sort(comparePositions)) {
      const path = shortestPath(state, enemy.position, cell, enemy.id);
      if (path && path.length > 0) plans.push({ targetId: h.id, cell, path });
    }
  }
  plans.sort(
    (a, b) =>
      a.path.length - b.path.length ||
      a.targetId.localeCompare(b.targetId) ||
      comparePositions(a.cell, b.cell),
  );
  const plan = plans[0];
  if (!plan)
    return {
      enemyId,
      targetId: null,
      action: "wait",
      reason: "cible inaccessible",
      path: [],
    };
  return {
    enemyId,
    targetId: plan.targetId,
    action: "move",
    reason: "avance vers une case d'attaque libre",
    path: plan.path,
  };
}
