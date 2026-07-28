import { gameShellMarkup } from "./shell-template";
import type { GameShell, HeroOption } from "./types";

export type { GameShell, GameShellUpdate, HeroOption } from "./types";

export function createGameShell(
  root: HTMLElement,
  heroes: HeroOption[],
  buildLabel: string,
): GameShell {
  root.innerHTML = gameShellMarkup(buildLabel);

  const query = <T extends Element>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Élément UI manquant: ${selector}`);
    return element;
  };

  const heroPicker = query<HTMLElement>("[data-hero-picker]");
  for (const [index, hero] of heroes.entries()) {
    const label = document.createElement("label");
    label.className = "hero-toggle";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = hero.id;
    input.checked = index === 0;
    input.setAttribute("aria-label", hero.name);
    const name = document.createElement("span");
    name.textContent = hero.name;
    label.append(input, name);
    heroPicker.append(label);
  }

  const status = query<HTMLElement>("[data-status]");
  const roomTitle = query<HTMLElement>("[data-room-title]");
  const roomObjective = query<HTMLElement>("[data-room-objective]");
  const progressStatus = query<HTMLElement>("[data-progress]");
  const resultPanel = query<HTMLElement>("[data-result]");
  const saveStatus = query<HTMLElement>("[data-save-status]");
  const cameraStatus = query<HTMLElement>("[data-camera-status]");
  const reducedMotionStatus = query<HTMLElement>("[data-reduced-motion]");
  const eventLog = query<HTMLElement>("[data-events]");
  const startButton = query<HTMLButtonElement>("[data-start]");
  const continueButton = query<HTMLButtonElement>("[data-continue]");
  const nextRoomButton = query<HTMLButtonElement>("[data-next-room]");
  const replayButton = query<HTMLButtonElement>("[data-replay]");
  const diagnosticToggleButton =
    query<HTMLButtonElement>("[data-diagnostic]");
  const rotateCameraButton = query<HTMLButtonElement>("[data-rotate-camera]");
  const endActivationButton = query<HTMLButtonElement>(
    "[data-end-activation]",
  );
  const endHeroesTurnButton = query<HTMLButtonElement>(
    "[data-end-heroes-turn]",
  );
  const resolveEnemyTurnButton = query<HTMLButtonElement>(
    "[data-resolve-enemy-turn]",
  );
  const muteAudioButton = query<HTMLButtonElement>("[data-audio-mute]");
  const volumeInput = query<HTMLInputElement>("[data-audio-volume]");
  const hud = query<HTMLElement>("[data-hud]");

  const trimEventLog = (): void => {
    while (eventLog.children.length > 6) eventLog.lastElementChild?.remove();
  };

  const setAudioSettings = (muted: boolean, volume: number): void => {
    muteAudioButton.setAttribute("aria-pressed", String(muted));
    muteAudioButton.textContent = muted ? "Activer le son" : "Couper le son";
    volumeInput.value = String(volume);
  };

  return {
    boardHost: query("[data-board]"),
    roomTitle,
    roomObjective,
    progressStatus,
    resultPanel,
    status,
    saveStatus,
    cameraStatus,
    eventLog,
    startButton,
    continueButton,
    nextRoomButton,
    replayButton,
    diagnosticToggleButton,
    rotateCameraButton,
    installButton: query("[data-install]"),
    heroPicker,
    tacticalActions: query("[data-tactical-actions]"),
    hud,
    endActivationButton,
    endHeroesTurnButton,
    resolveEnemyTurnButton,
    muteAudioButton,
    volumeInput,
    reducedMotionStatus,
    update(next) {
      const tacticalPhase = next.tacticalPhase ?? null;
      const expeditionStatus = next.expeditionStatus ?? null;
      status.textContent = statusText(
        next.phase,
        expeditionStatus,
        tacticalPhase,
      );
      status.dataset.active = String(next.phase === "expedition");
      roomTitle.textContent = next.roomName ?? "Le Château de Bastognac";
      roomObjective.textContent =
        next.roomObjective ??
        "Choisissez votre équipe avant d’entrer dans les trois salles.";
      progressStatus.textContent =
        next.roomProgress ?? "MICRO-DONJON · PRÉPARATION";

      startButton.disabled = !(next.canStart ?? true);
      continueButton.disabled = !next.canContinue;
      nextRoomButton.disabled = !next.canTransition;
      nextRoomButton.hidden = !next.canTransition;
      nextRoomButton.textContent =
        next.transitionLabel ?? "Passer à la salle suivante";
      replayButton.disabled = !next.canReplay;
      replayButton.hidden = !next.canReplay;
      rotateCameraButton.disabled = !next.canRotateCamera;
      cameraStatus.textContent = `Vue : ${next.cameraRotation ?? 0}°`;
      saveStatus.textContent = next.saveText;
      reducedMotionStatus.textContent = next.reducedMotion
        ? "Activé"
        : "Désactivé";
      reducedMotionStatus.dataset.active = String(next.reducedMotion ?? false);
      setAudioSettings(next.audioMuted ?? false, next.audioVolume ?? 0.7);

      const diagnostic = next.diagnosticMode ?? false;
      diagnosticToggleButton.setAttribute("aria-pressed", String(diagnostic));
      diagnosticToggleButton.textContent = diagnostic
        ? "Quitter le mode diagnostic"
        : "Activer le mode diagnostic";
      diagnosticToggleButton.dataset.active = String(diagnostic);

      resultPanel.hidden = !next.resultText;
      resultPanel.textContent = next.resultText ?? "";

      const brouhahaEffects = next.brouhahaEffects?.length
        ? ` · Effets: ${next.brouhahaEffects.join(" + ")}`
        : "";
      hud.textContent = `Héros actif: ${next.activeHero ?? "aucun"} · Actions: ${"●".repeat(next.actions ?? 0)}${"○".repeat(Math.max(0, 3 - (next.actions ?? 0)))} · Brouhaha: ${next.brouhahaLevel ?? 0}/${next.brouhahaMax ?? 12}${brouhahaEffects} · Phase: ${tacticalPhase ?? "préparation"}`;
      endActivationButton.disabled =
        tacticalPhase !== "heroes-turn" || !next.activeHero;
      endHeroesTurnButton.disabled = tacticalPhase !== "heroes-turn";
      resolveEnemyTurnButton.disabled = tacticalPhase !== "enemy-turn";

      const expeditionActive = next.phase === "expedition";
      for (const input of heroPicker.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      )) {
        if (next.selectedHeroIds)
          input.checked = next.selectedHeroIds.includes(input.value);
        input.disabled = expeditionActive;
      }
    },
    setSaveStatus(message) {
      saveStatus.textContent = message;
    },
    setAudioSettings,
    appendEvent(message) {
      const item = document.createElement("li");
      item.textContent = message;
      eventLog.prepend(item);
      trimEventLog();
    },
    appendEventGroup(entry) {
      const item = document.createElement("li");
      item.className = "event-entry";
      item.dataset.rootId = entry.rootId;
      item.dataset.tone = entry.tone;
      item.dataset.eventTypes = entry.eventTypes.join(",");
      const summary = document.createElement("strong");
      summary.textContent = entry.summary;
      item.append(summary);
      if (entry.details.length > 0) {
        const details = document.createElement("ul");
        for (const detail of entry.details) {
          const line = document.createElement("li");
          line.textContent = detail;
          details.append(line);
        }
        item.append(details);
      }
      eventLog.prepend(item);
      trimEventLog();
    },
  };
}

function statusText(
  phase: "boot" | "menu" | "expedition",
  expeditionStatus:
    | "preparation"
    | "in-progress"
    | "victory"
    | "defeat"
    | null,
  tacticalPhase: "heroes-turn" | "enemy-turn" | "victory" | "defeat" | null,
): string {
  if (expeditionStatus === "victory") return "Victoire";
  if (expeditionStatus === "defeat") return "Défaite";
  if (phase !== "expedition") return "Préparation";
  if (tacticalPhase === "victory") return "Salle sécurisée";
  if (tacticalPhase === "defeat") return "Défaite";
  return "Salle en cours";
}
