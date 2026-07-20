import { hasLineOfSight } from "./line-of-sight";
import { manhattanDistance } from "./grid";
import { err, ok, type TacticalResult } from "./errors";
import type { TacticalEvent } from "./events";
import type { Combatant, RoomState } from "./types";
export const calculateDamage = (
  attacker: Combatant,
  target: Combatant,
): number => Math.max(1, attacker.atk - target.def);
export function attackTarget(
  state: RoomState,
  attackerId: string,
  targetId: string,
): TacticalResult<{ state: RoomState; events: TacticalEvent[] }> {
  if (state.phase !== "heroes-turn")
    return err("not-heroes-turn", "Ce n'est pas le tour des héros.");
  const attacker = state.heroes.find((h) => h.id === attackerId);
  if (!attacker?.alive) return err("hero-not-found", "Héros introuvable.");
  if (state.activeHeroId !== attackerId)
    return err("not-active-hero", "Seul le héros actif peut attaquer.");
  if (attacker.actionsRemaining <= 0)
    return err("no-actions", "Aucune action restante.");
  const target = state.enemies.find((e) => e.id === targetId);
  if (!target?.alive) return err("target-invalid", "Cible invalide.");
  if (manhattanDistance(attacker.position, target.position) > attacker.range)
    return err("out-of-range", "Cible hors portée.");
  if (
    !hasLineOfSight(state, attacker.position, target.position, [
      attacker.id,
      target.id,
    ])
  )
    return err("line-of-sight-blocked", "Ligne de vue bloquée.");
  const damage = calculateDamage(attacker, target);
  const hp = Math.max(0, target.hp - damage);
  const defeated = hp === 0;
  const events: TacticalEvent[] = [
    {
      type: "combatant-attacked",
      attackerId,
      targetId,
      damage,
      remainingHp: hp,
    },
  ];
  if (defeated)
    events.push({ type: "combatant-defeated", combatantId: targetId });
  const next = {
    ...state,
    heroes: state.heroes.map((h) =>
      h.id === attackerId
        ? { ...h, actionsRemaining: h.actionsRemaining - 1 }
        : h,
    ),
    enemies: state.enemies.map((e) =>
      e.id === targetId
        ? {
            ...e,
            hp,
            alive: !defeated,
            blocksMovement: defeated ? false : e.blocksMovement,
          }
        : e,
    ),
  };
  return ok({ state: next, events });
}
export function enemyAttack(
  state: RoomState,
  enemyId: string,
  heroId: string,
): { state: RoomState; events: TacticalEvent[] } | null {
  const attacker = state.enemies.find((e) => e.id === enemyId && e.alive);
  const target = state.heroes.find((h) => h.id === heroId && h.alive);
  if (!attacker || !target) return null;
  if (manhattanDistance(attacker.position, target.position) > attacker.range)
    return null;
  if (
    !hasLineOfSight(state, attacker.position, target.position, [
      attacker.id,
      target.id,
    ])
  )
    return null;
  const damage = calculateDamage(attacker, target);
  const hp = Math.max(0, target.hp - damage);
  const defeated = hp === 0;
  const events: TacticalEvent[] = [
    {
      type: "combatant-attacked",
      attackerId: enemyId,
      targetId: heroId,
      damage,
      remainingHp: hp,
    },
  ];
  if (defeated)
    events.push({ type: "combatant-defeated", combatantId: heroId });
  return {
    state: {
      ...state,
      heroes: state.heroes.map((h) =>
        h.id === heroId
          ? {
              ...h,
              hp,
              alive: !defeated,
              blocksMovement: defeated ? false : h.blocksMovement,
            }
          : h,
      ),
    },
    events,
  };
}
