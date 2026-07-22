export interface HeroOption {
  id: string;
  name: string;
}

export interface GameShell {
  boardHost: HTMLElement;
  status: HTMLElement;
  saveStatus: HTMLElement;
  cameraStatus: HTMLElement;
  eventLog: HTMLElement;
  startButton: HTMLButtonElement;
  continueButton: HTMLButtonElement;
  rotateCameraButton: HTMLButtonElement;
  installButton: HTMLButtonElement;
  heroPicker: HTMLElement;
  tacticalActions: HTMLElement;
  hud: HTMLElement;
  endActivationButton: HTMLButtonElement;
  endHeroesTurnButton: HTMLButtonElement;
  resolveEnemyTurnButton: HTMLButtonElement;
  update(state: {
    phase: string;
    tacticalPhase?: string | null;
    expeditionNumber: number;
    canContinue: boolean;
    canRotateCamera?: boolean;
    cameraRotation?: number;
    saveText: string;
    actions?: number;
    activeHero?: string | null;
    selectedHeroIds?: string[];
  }): void;
  appendEvent(message: string): void;
}

export function createGameShell(
  root: HTMLElement,
  heroes: HeroOption[],
): GameShell {
  root.innerHTML = `<div class="app-shell"><header class="topbar"><div><p class="eyebrow">LA CHOPE QUI COLLE PRÉSENTE</p><h1>Gargotte Adventure</h1></div><div class="build-badge" aria-label="Version Sprint un">Sprint 1</div></header><main class="game-layout"><section class="board-panel" aria-labelledby="board-title"><div class="panel-heading"><div><p class="eyebrow">PREMIER DONJON</p><h2 id="board-title">Le Château de Bastognac</h2></div><span class="status-chip" data-status>Préparation</span></div><div class="board-host" data-board></div></section><aside class="control-panel" aria-label="Commandes tactiques"><section class="hero-card"><p class="eyebrow">SALLE TACTIQUE</p><h2>Choisir l'équipe</h2><div data-hero-picker class="hero-picker"></div></section><div class="actions"><button class="button button-primary" type="button" data-start>Entrer dans la salle</button><button class="button button-secondary" type="button" data-continue disabled>Reprendre</button><button class="button button-ghost" type="button" data-rotate-camera disabled>↻ Pivoter la caméra de 90°</button><button class="button button-secondary" type="button" data-end-activation disabled>Terminer l'activation</button><button class="button button-ghost" type="button" data-end-heroes-turn disabled>Terminer le tour des héros</button><button class="button button-ghost" type="button" data-resolve-enemy-turn disabled>Résoudre le tour ennemi</button><button class="button button-ghost" type="button" data-install hidden>Installer l'application</button></div><section class="system-card" aria-live="polite"><div class="system-line"><span>Sauvegarde locale</span><strong data-save-status>Initialisation…</strong></div><div class="system-line"><span>Caméra de contrôle</span><strong data-camera-status>Vue : 0°</strong></div><div data-hud class="hud">Actions: ●●●</div></section><section class="tactical-actions-card"><p class="eyebrow">COMMANDES ACCESSIBLES</p><div data-tactical-actions class="tactical-actions" aria-label="Actions tactiques disponibles"></div></section><section class="event-card"><p class="eyebrow">JOURNAL</p><ol data-events><li>La salle tactique est prête.</li></ol></section></aside></main><footer>Aucun réseau requis pour jouer. Interface tactile paysage.</footer></div>`;

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
  const saveStatus = query<HTMLElement>("[data-save-status]");
  const cameraStatus = query<HTMLElement>("[data-camera-status]");
  const eventLog = query<HTMLElement>("[data-events]");
  const continueButton = query<HTMLButtonElement>("[data-continue]");
  const rotateCameraButton = query<HTMLButtonElement>("[data-rotate-camera]");
  const endActivationButton = query<HTMLButtonElement>("[data-end-activation]");
  const endHeroesTurnButton = query<HTMLButtonElement>(
    "[data-end-heroes-turn]",
  );
  const resolveEnemyTurnButton = query<HTMLButtonElement>(
    "[data-resolve-enemy-turn]",
  );

  return {
    boardHost: query("[data-board]"),
    status,
    saveStatus,
    cameraStatus,
    eventLog,
    startButton: query("[data-start]"),
    continueButton,
    rotateCameraButton,
    installButton: query("[data-install]"),
    heroPicker,
    tacticalActions: query("[data-tactical-actions]"),
    hud: query("[data-hud]"),
    endActivationButton,
    endHeroesTurnButton,
    resolveEnemyTurnButton,
    update(next) {
      const tacticalPhase = next.tacticalPhase ?? null;
      status.textContent =
        next.phase === "expedition"
          ? tacticalPhase === "victory"
            ? "Victoire"
            : tacticalPhase === "defeat"
              ? "Défaite"
              : "Salle en cours"
          : next.phase;
      status.dataset.active = String(next.phase === "expedition");
      continueButton.disabled = !next.canContinue;
      rotateCameraButton.disabled = !next.canRotateCamera;
      cameraStatus.textContent = `Vue : ${next.cameraRotation ?? 0}°`;
      saveStatus.textContent = next.saveText;
      this.hud.textContent = `Héros actif: ${next.activeHero ?? "aucun"} · Actions: ${"●".repeat(next.actions ?? 0)}${"○".repeat(Math.max(0, 3 - (next.actions ?? 0)))} · Phase: ${tacticalPhase ?? "menu"}`;
      endActivationButton.disabled =
        tacticalPhase !== "heroes-turn" || !next.activeHero;
      endHeroesTurnButton.disabled = tacticalPhase !== "heroes-turn";
      resolveEnemyTurnButton.disabled = tacticalPhase !== "enemy-turn";

      if (next.selectedHeroIds) {
        for (const input of heroPicker.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]',
        )) {
          input.checked = next.selectedHeroIds.includes(input.value);
        }
      }
    },
    appendEvent(message) {
      const item = document.createElement("li");
      item.textContent = message;
      eventLog.prepend(item);
      while (eventLog.children.length > 6) eventLog.lastElementChild?.remove();
    },
  };
}
