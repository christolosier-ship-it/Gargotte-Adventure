import "virtual:pwa-register";
import "./styles.css";
import { APP_VERSION } from "@gargotte/common";
import {
  EventBus,
  attackTarget,
  createEvent,
  createInitialGameState,
  createRoomState,
  endHeroActivation,
  endHeroesTurn,
  finishEnemyTurn,
  getAttackableTargets,
  moveCombatant,
  reachablePositions,
  reduceGameState,
  selectHero,
  type GameState,
  type RoomState,
} from "@gargotte/engine";
import { createTabletopRenderer } from "@gargotte/renderer";
import {
  loadGameState,
  loadRoomState,
  saveGameState,
  saveRoomState,
} from "@gargotte/save";
import { createGameShell } from "@gargotte/ui";
import dungeon from "../../../content/bastognac/dungeon.json";
import roomDefinition from "../../../content/bastognac/sprint-1-room.json";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Point de montage #app introuvable.");

const defaultHeroId = roomDefinition.heroes[0]?.id;
if (!defaultHeroId) throw new Error("Aucun héros disponible dans le scénario.");
const validHeroIds = new Set(roomDefinition.heroes.map((hero) => hero.id));
const shell = createGameShell(
  root,
  roomDefinition.heroes.map((hero) => ({ id: hero.id, name: hero.name })),
);
const renderer = await createTabletopRenderer(shell.boardHost);
const events = new EventBus();
let state: GameState = createInitialGameState(1);
let room: RoomState | null = null;
let selectedHeroIds = [defaultHeroId];
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

const stored = await loadGameState();
if (stored) state = stored;
const storedRoom = await loadRoomState();
if (storedRoom && storedRoom !== "legacy") {
  room = storedRoom.room;
  selectedHeroIds = storedRoom.selectedHeroIds.filter((id) =>
    validHeroIds.has(id),
  );
  if (selectedHeroIds.length === 0) selectedHeroIds = [defaultHeroId];
  state = {
    ...state,
    phase: "expedition",
    expeditionNumber: Math.max(1, state.expeditionNumber),
  };
}
state = reduceGameState(state, createEvent("app/ready"));
if (room) state = { ...state, phase: "expedition" };

function buildRoom(): RoomState {
  const chosen = roomDefinition.heroes.filter((hero) =>
    selectedHeroIds.includes(hero.id),
  );
  return createRoomState({
    scenarioId: roomDefinition.id,
    width: roomDefinition.grid.width,
    height: roomDefinition.grid.height,
    obstacles: roomDefinition.obstacles,
    heroes: chosen,
    enemies: roomDefinition.enemies,
  });
}

function highlights() {
  const hero = room?.heroes.find(
    (candidate) => candidate.id === room?.activeHeroId,
  );
  return {
    reachable:
      room && hero
        ? reachablePositions(
            room,
            hero.position,
            hero.actionsRemaining,
            hero.id,
          )
        : [],
    attackable: room && hero ? getAttackableTargets(room, hero.id) : [],
  };
}

const render = (
  saveText = storedRoom && storedRoom !== "legacy"
    ? "Salle restaurée"
    : "Prête",
) => {
  const active = room?.heroes.find(
    (hero) => hero.id === room?.activeHeroId,
  );
  shell.update({
    phase: state.phase,
    tacticalPhase: room?.phase ?? null,
    expeditionNumber: state.expeditionNumber,
    canContinue: Boolean(room),
    saveText,
    actions: active?.actionsRemaining ?? 0,
    activeHero: active?.name ?? null,
    selectedHeroIds,
  });
  if (room) renderer.renderRoom(room, highlights());
  else renderer.setExpeditionActive(false);
};

const persist = async () => {
  if (room)
    await saveRoomState({
      kind: "tactical-room",
      version: 1,
      room,
      selectedHeroIds,
    });
  await saveGameState(state);
  render("Enregistrée sur cet appareil");
};

events.subscribe((event) => {
  state = reduceGameState(state, event);
  shell.appendEvent(eventMessage(event.type));
  void persist();
});

shell.heroPicker.addEventListener("change", () => {
  const inputs = [
    ...shell.heroPicker.querySelectorAll<HTMLInputElement>("input:checked"),
  ];
  selectedHeroIds = inputs.map((input) => input.value).slice(0, 4);
  if (selectedHeroIds.length === 0) {
    selectedHeroIds = [defaultHeroId];
    const fallback = shell.heroPicker.querySelector<HTMLInputElement>(
      `input[value="${defaultHeroId}"]`,
    );
    if (fallback) fallback.checked = true;
  }
});

shell.startButton.addEventListener("click", () => {
  room = buildRoom();
  const seed = 10000 + state.expeditionNumber * 137 + 1;
  events.publish(createEvent("expedition/started", { seed }));
  render("Salle lancée");
});

shell.continueButton.addEventListener("click", () => {
  if (room) {
    state = { ...state, phase: "expedition" };
    shell.appendEvent("Reprise de la salle sauvegardée.");
    render("Salle restaurée");
  }
});

shell.endActivationButton.addEventListener("click", () => {
  if (!room?.activeHeroId) return;
  const result = endHeroActivation(room, room.activeHeroId);
  if (result.ok) {
    room = result.value.state;
    result.value.events.forEach((event) => shell.appendEvent(event.type));
    void persist();
  } else shell.appendEvent(result.error.message);
});

shell.endHeroesTurnButton.addEventListener("click", () => {
  if (!room) return;
  const result = endHeroesTurn(room);
  if (result.ok) {
    room = result.value.state;
    result.value.events.forEach((event) => shell.appendEvent(event.type));
    void persist();
  } else shell.appendEvent(result.error.message);
});

shell.resolveEnemyTurnButton.addEventListener("click", () => {
  if (!room) return;
  const result = finishEnemyTurn(room);
  if (result.ok) {
    room = result.value.state;
    result.value.events.forEach((event) => shell.appendEvent(event.type));
    void persist();
  } else shell.appendEvent(result.error.message);
});

renderer.onHeroSelected((heroId) => {
  if (!room) return;
  const result = selectHero(room, heroId);
  if (result.ok) {
    room = result.value.state;
    shell.appendEvent(`Héros sélectionné: ${heroId}.`);
    void persist();
  } else shell.appendEvent(result.error.message);
});

renderer.onCellSelected((position) => {
  if (!room?.activeHeroId) return;
  const result = moveCombatant(room, room.activeHeroId, position);
  if (result.ok) {
    room = result.value.state;
    result.value.events.forEach(() => shell.appendEvent("Déplacement."));
    void persist();
  } else shell.appendEvent(result.error.message);
});

renderer.onEnemySelected((enemyId) => {
  if (!room?.activeHeroId) return;
  const result = attackTarget(room, room.activeHeroId, enemyId);
  if (result.ok) {
    room = result.value.state;
    result.value.events.forEach((event) => shell.appendEvent(event.type));
    void persist();
  } else shell.appendEvent(result.error.message);
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event as BeforeInstallPromptEvent;
  shell.installButton.hidden = false;
});

shell.installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  await deferredInstallPrompt.prompt();
  deferredInstallPrompt = null;
  shell.installButton.hidden = true;
});

window.addEventListener("appinstalled", () =>
  shell.appendEvent("Gargotte Adventure est installé sur l’appareil."),
);

render();
shell.appendEvent(`${dungeon.name} chargé · ${APP_VERSION}.`);

function eventMessage(type: string): string {
  return type === "expedition/started"
    ? "Les héros entrent dans la salle tactique."
    : type === "expedition/returned-to-menu"
      ? "Retour au menu."
      : "Le moteur de jeu est prêt.";
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
  }
}
