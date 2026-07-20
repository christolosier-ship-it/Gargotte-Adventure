export interface GameShell {
  boardHost: HTMLElement;
  status: HTMLElement;
  saveStatus: HTMLElement;
  eventLog: HTMLElement;
  startButton: HTMLButtonElement;
  continueButton: HTMLButtonElement;
  installButton: HTMLButtonElement;
  update(state: {
    phase: string;
    expeditionNumber: number;
    canContinue: boolean;
    saveText: string;
  }): void;
  appendEvent(message: string): void;
}

export function createGameShell(root: HTMLElement): GameShell {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">LA CHOPE QUI COLLE PRÉSENTE</p>
          <h1>Gargotte Adventure</h1>
        </div>
        <div class="build-badge" aria-label="Version Sprint zéro">Sprint 0</div>
      </header>

      <main class="game-layout">
        <section class="board-panel" aria-labelledby="board-title">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">PREMIER DONJON</p>
              <h2 id="board-title">Le Château de Bastognac</h2>
            </div>
            <span class="status-chip" data-status>Préparation</span>
          </div>
          <div class="board-host" data-board></div>
        </section>

        <aside class="control-panel" aria-label="Commandes de l'expédition">
          <section class="hero-card">
            <p class="eyebrow">VERTICAL SLICE</p>
            <h2>La table est dressée</h2>
            <p>
              Le moteur, la sauvegarde, le rendu et le contenu sont séparés. Le premier combat arrivera au Sprint 1.
            </p>
          </section>

          <div class="actions">
            <button class="button button-primary" type="button" data-start>
              Nouvelle expédition
            </button>
            <button class="button button-secondary" type="button" data-continue disabled>
              Continuer
            </button>
            <button class="button button-ghost" type="button" data-install hidden>
              Installer l'application
            </button>
          </div>

          <section class="system-card" aria-live="polite">
            <div class="system-line">
              <span>Sauvegarde locale</span>
              <strong data-save-status>Initialisation…</strong>
            </div>
            <div class="system-line">
              <span>Mode hors ligne</span>
              <strong>Prêt après le premier chargement</strong>
            </div>
          </section>

          <section class="event-card">
            <p class="eyebrow">JOURNAL DE BERTHOLD</p>
            <ol data-events>
              <li>La cave technique est ouverte.</li>
            </ol>
          </section>
        </aside>
      </main>

      <footer>
        Aucun dé caché. Aucun secret dans le client. Aucun gobelin dans la CI.
      </footer>
    </div>
  `;

  const boardHost = required<HTMLElement>(root, '[data-board]');
  const status = required<HTMLElement>(root, '[data-status]');
  const saveStatus = required<HTMLElement>(root, '[data-save-status]');
  const eventLog = required<HTMLElement>(root, '[data-events]');
  const startButton = required<HTMLButtonElement>(root, '[data-start]');
  const continueButton = required<HTMLButtonElement>(root, '[data-continue]');
  const installButton = required<HTMLButtonElement>(root, '[data-install]');

  return {
    boardHost,
    status,
    saveStatus,
    eventLog,
    startButton,
    continueButton,
    installButton,
    update(next) {
      status.textContent = next.phase === 'expedition' ? 'Expédition en cours' : 'Préparation';
      status.dataset.active = String(next.phase === 'expedition');
      continueButton.disabled = !next.canContinue;
      continueButton.textContent = next.expeditionNumber
        ? `Continuer l'expédition ${next.expeditionNumber}`
        : 'Continuer';
      saveStatus.textContent = next.saveText;
    },
    appendEvent(message) {
      const item = document.createElement('li');
      item.textContent = message;
      eventLog.prepend(item);
      while (eventLog.children.length > 4) eventLog.lastElementChild?.remove();
    }
  };
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Élément UI manquant: ${selector}`);
  return element;
}
