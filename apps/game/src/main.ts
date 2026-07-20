import "virtual:pwa-register";
import "./styles.css";
import { APP_VERSION } from "@gargotte/common";
import {
  EventBus,
  createEvent,
  createInitialGameState,
  reduceGameState,
  type GameState,
} from "@gargotte/engine";
import { createTabletopRenderer } from "@gargotte/renderer";
import { createGameShell } from "@gargotte/ui";
import { loadGameState, saveGameState } from "@gargotte/save";
import dungeon from "../../../content/bastognac/dungeon.json";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Point de montage #app introuvable.");

const shell = createGameShell(root);
const renderer = await createTabletopRenderer(shell.boardHost);
const events = new EventBus();
let state: GameState = createInitialGameState(1);
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

const stored = await loadGameState();
if (stored) state = stored;
state = reduceGameState(state, createEvent("app/ready"));

const render = (saveText = stored ? "Sauvegarde restaurée" : "Prête") => {
  shell.update({
    phase: state.phase,
    expeditionNumber: state.expeditionNumber,
    canContinue: state.expeditionNumber > 0,
    saveText,
  });
  renderer.setExpeditionActive(state.phase === "expedition");
};

const persist = async () => {
  await saveGameState(state);
  render("Enregistrée sur cet appareil");
};

events.subscribe((event) => {
  state = reduceGameState(state, event);
  shell.appendEvent(eventMessage(event.type));
  void persist();
});

shell.startButton.addEventListener("click", () => {
  const seed = 10_000 + state.expeditionNumber * 137 + 1;
  events.publish(createEvent("expedition/started", { seed }));
});

shell.continueButton.addEventListener("click", () => {
  shell.appendEvent(`Retour sur la table, graine ${state.seed}.`);
  renderer.setExpeditionActive(true);
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

window.addEventListener("appinstalled", () => {
  shell.appendEvent("Gargotte Adventure est installé sur l’appareil.");
});

render();
shell.appendEvent(`${dungeon.name} chargé · ${APP_VERSION}.`);

function eventMessage(type: string): string {
  switch (type) {
    case "expedition/started":
      return "Une nouvelle expédition quitte La Chope Qui Colle.";
    case "expedition/returned-to-menu":
      return "Les héros reviennent compter leurs bosses.";
    default:
      return "Le moteur de jeu est prêt.";
  }
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
