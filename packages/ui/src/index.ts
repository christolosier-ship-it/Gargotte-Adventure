export interface GameShell {
  boardHost: HTMLElement;
  status: HTMLElement;
  saveStatus: HTMLElement;
  eventLog: HTMLElement;
  startButton: HTMLButtonElement;
  continueButton: HTMLButtonElement;
  installButton: HTMLButtonElement;
  heroPicker: HTMLElement;
  hud: HTMLElement;
  endActivationButton: HTMLButtonElement;
  endTurnButton: HTMLButtonElement;
  update(state: {
    phase: string;
    expeditionNumber: number;
    canContinue: boolean;
    saveText: string;
    actions?: number;
    activeHero?: string | null;
    selectedHeroIds?: string[];
  }): void;
  appendEvent(message: string): void;
}
export function createGameShell(root: HTMLElement): GameShell {
  root.innerHTML = `<div class="app-shell"><header class="topbar"><div><p class="eyebrow">LA CHOPE QUI COLLE PRÉSENTE</p><h1>Gargotte Adventure</h1></div><div class="build-badge" aria-label="Version Sprint un">Sprint 1</div></header><main class="game-layout"><section class="board-panel" aria-labelledby="board-title"><div class="panel-heading"><div><p class="eyebrow">PREMIER DONJON</p><h2 id="board-title">Le Château de Bastognac</h2></div><span class="status-chip" data-status>Préparation</span></div><div class="board-host" data-board></div></section><aside class="control-panel" aria-label="Commandes tactiques"><section class="hero-card"><p class="eyebrow">SALLE TACTIQUE</p><h2>Choisir l'équipe</h2><div data-hero-picker class="hero-picker"></div></section><div class="actions"><button class="button button-primary" type="button" data-start>Entrer dans la salle</button><button class="button button-secondary" type="button" data-continue disabled>Reprendre</button><button class="button button-secondary" type="button" data-end-activation>Terminer l'activation</button><button class="button button-ghost" type="button" data-end-turn>Résoudre le tour ennemi</button><button class="button button-ghost" type="button" data-install hidden>Installer l'application</button></div><section class="system-card" aria-live="polite"><div class="system-line"><span>Sauvegarde locale</span><strong data-save-status>Initialisation…</strong></div><div data-hud class="hud">Actions: ●●●</div></section><section class="event-card"><p class="eyebrow">JOURNAL</p><ol data-events><li>La salle tactique est prête.</li></ol></section></aside></main><footer>Aucun réseau requis pour jouer. Interface tactile paysage.</footer></div>`;
  const q = <T extends Element>(s: string) => {
    const e = root.querySelector<T>(s);
    if (!e) throw new Error(`Élément UI manquant: ${s}`);
    return e;
  };
  const heroPicker = q<HTMLElement>("[data-hero-picker]");
  const heroes = ["berthold", "azeline", "mirepoix", "guillemette"];
  heroPicker.innerHTML = heroes
    .map(
      (h) =>
        `<label class="hero-toggle"><input type="checkbox" value="${h}" ${h === "berthold" ? "checked" : ""}/> ${h}</label>`,
    )
    .join("");
  const status = q<HTMLElement>("[data-status]"),
    saveStatus = q<HTMLElement>("[data-save-status]"),
    eventLog = q<HTMLElement>("[data-events]"),
    continueButton = q<HTMLButtonElement>("[data-continue]");
  return {
    boardHost: q("[data-board]"),
    status,
    saveStatus,
    eventLog,
    startButton: q("[data-start]"),
    continueButton,
    installButton: q("[data-install]"),
    heroPicker,
    hud: q("[data-hud]"),
    endActivationButton: q("[data-end-activation]"),
    endTurnButton: q("[data-end-turn]"),
    update(next) {
      status.textContent =
        next.phase === "expedition" ? "Salle en cours" : next.phase;
      status.dataset.active = String(next.phase === "expedition");
      continueButton.disabled = !next.canContinue;
      saveStatus.textContent = next.saveText;
      this.hud.textContent = `Héros actif: ${next.activeHero ?? "aucun"} · Actions: ${"●".repeat(next.actions ?? 0)}${"○".repeat(3 - (next.actions ?? 0))}`;
    },
    appendEvent(message) {
      const item = document.createElement("li");
      item.textContent = message;
      eventLog.prepend(item);
      while (eventLog.children.length > 6) eventLog.lastElementChild?.remove();
    },
  };
}
