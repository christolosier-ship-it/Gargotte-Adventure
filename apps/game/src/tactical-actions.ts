import {
  getAttackableTargets,
  reachablePositions,
  type GridPosition,
  type RoomState,
} from "@gargotte/engine";

export interface TacticalActionHandlers {
  selectHero(heroId: string): void;
  move(position: GridPosition): void;
  attack(enemyId: string): void;
}

function createActionButton(
  label: string,
  onClick: () => void,
  disabled = false,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-ghost";
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

export function renderTacticalActions(
  container: HTMLElement,
  room: RoomState | null,
  handlers: TacticalActionHandlers,
): void {
  container.replaceChildren();
  if (!room) return;

  if (room.phase === "victory" || room.phase === "defeat") {
    const message = document.createElement("strong");
    message.textContent =
      room.phase === "victory" ? "Salle nettoyée !" : "Expédition vaincue.";
    container.append(message);
    return;
  }

  if (room.phase !== "heroes-turn") {
    const message = document.createElement("span");
    message.textContent = "Les ennemis préparent leur mauvais coup.";
    container.append(message);
    return;
  }

  for (const hero of room.heroes.filter(
    (candidate) => candidate.alive && !candidate.activationCompleted,
  ))
    container.append(
      createActionButton(
        `Activer ${hero.name}`,
        () => handlers.selectHero(hero.id),
        Boolean(room.activeHeroId && room.activeHeroId !== hero.id),
      ),
    );

  const activeHero = room.heroes.find((hero) => hero.id === room.activeHeroId);
  if (!activeHero) return;

  for (const position of reachablePositions(
    room,
    activeHero.position,
    activeHero.actionsRemaining,
    activeHero.id,
  ))
    container.append(
      createActionButton(
        `Se déplacer en colonne ${position.column + 1}, ligne ${position.row + 1}`,
        () => handlers.move(position),
      ),
    );

  for (const enemyId of getAttackableTargets(room, activeHero.id)) {
    const enemy = room.enemies.find((candidate) => candidate.id === enemyId);
    if (!enemy) continue;
    container.append(
      createActionButton(`Attaquer ${enemy.name}`, () => handlers.attack(enemyId)),
    );
  }
}
