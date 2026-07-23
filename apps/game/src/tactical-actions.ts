import {
  getAttackableTargets,
  reachablePositions,
  type GridPosition,
  type RoomState,
} from "@gargotte/engine";
import type {
  BrouhahaControlAction,
  BrouhahaControlId,
} from "./brouhaha-controller";
import type { InteractableAction } from "./interactable-controller";

export interface ScriptedSpawnAction {
  id: string;
  label: string;
}

export interface TacticalActionHandlers {
  selectHero(heroId: string): void;
  move(position: GridPosition): void;
  attack(enemyId: string): void;
  interact(interactableInstanceId: string, interactionId: string): void;
  spawn(spawnId: string): void;
  brouhaha(controlId: BrouhahaControlId): void;
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
  scriptedSpawns: readonly ScriptedSpawnAction[] = [],
  brouhahaControls: readonly BrouhahaControlAction[] = [],
  interactableActions: readonly InteractableAction[] = [],
): void {
  container.replaceChildren();
  if (!room) return;

  const brouhahaStatus = document.createElement("strong");
  brouhahaStatus.textContent = `Brouhaha ${room.brouhaha.level}/12`;
  brouhahaStatus.setAttribute(
    "aria-label",
    `Brouhaha ${room.brouhaha.level} sur 12`,
  );
  container.append(brouhahaStatus);

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

  for (const control of brouhahaControls)
    container.append(
      createActionButton(control.label, () => handlers.brouhaha(control.id)),
    );

  for (const spawn of scriptedSpawns)
    container.append(
      createActionButton(`🧪 ${spawn.label}`, () => handlers.spawn(spawn.id)),
    );

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

  for (const action of interactableActions)
    container.append(
      createActionButton(
        `🧱 ${action.label} ${action.objectName}`,
        () =>
          handlers.interact(
            action.interactableInstanceId,
            action.interactionId,
          ),
      ),
    );

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
      createActionButton(`Attaquer ${enemy.name}`, () =>
        handlers.attack(enemyId),
      ),
    );
  }
}
