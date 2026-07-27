function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function gameShellMarkup(buildLabel: string): string {
  const label = escapeHtml(buildLabel);
  return `<div class="app-shell">
    <header class="topbar">
      <div><p class="eyebrow">LA CHOPE QUI COLLE PRÉSENTE</p><h1>Gargotte Adventure</h1></div>
      <div class="build-badge" aria-label="Version ${label}">${label}</div>
    </header>
    <main class="game-layout">
      <section class="board-panel" aria-labelledby="board-title">
        <div class="panel-heading">
          <div><p class="eyebrow">PREMIER DONJON</p><h2 id="board-title">Le Château de Bastognac</h2></div>
          <span class="status-chip" data-status>Préparation</span>
        </div>
        <div class="board-host" data-board></div>
      </section>
      <aside class="control-panel" aria-label="Commandes tactiques">
        <section class="hero-card">
          <p class="eyebrow">SALLE TACTIQUE</p><h2>Choisir l'équipe</h2>
          <div data-hero-picker class="hero-picker"></div>
        </section>
        <div class="actions">
          <button class="button button-primary" type="button" data-start>Entrer dans la salle</button>
          <button class="button button-secondary" type="button" data-continue disabled>Reprendre</button>
          <button class="button button-ghost" type="button" data-rotate-camera disabled>↻ Pivoter la caméra de 90°</button>
          <button class="button button-secondary" type="button" data-end-activation disabled>Terminer l'activation</button>
          <button class="button button-ghost" type="button" data-end-heroes-turn disabled>Terminer le tour des héros</button>
          <button class="button button-ghost" type="button" data-resolve-enemy-turn disabled>Résoudre le tour ennemi</button>
          <button class="button button-ghost" type="button" data-install hidden>Installer l'application</button>
        </div>
        <section class="system-card" aria-live="polite">
          <div class="system-line"><span>Sauvegarde locale</span><strong data-save-status>Initialisation…</strong></div>
          <div class="system-line"><span>Caméra de contrôle</span><strong data-camera-status>Vue : 0°</strong></div>
          <div class="system-line"><span>Mouvement réduit</span><strong data-reduced-motion>Selon l’appareil</strong></div>
          <div class="audio-controls" aria-label="Réglages audio">
            <button class="button button-ghost audio-toggle" type="button" data-audio-mute aria-pressed="false">Couper le son</button>
            <label class="volume-control">Volume général
              <input data-audio-volume type="range" min="0" max="1" step="0.05" value="0.7" aria-label="Volume général" />
            </label>
          </div>
          <div data-hud class="hud">Actions: ●●●</div>
        </section>
        <section class="tactical-actions-card">
          <p class="eyebrow">COMMANDES ACCESSIBLES</p>
          <div data-tactical-actions class="tactical-actions" aria-label="Actions tactiques disponibles"></div>
        </section>
        <section class="event-card">
          <p class="eyebrow">JOURNAL</p>
          <ol data-events aria-label="Journal tactique"><li>La salle tactique est prête.</li></ol>
        </section>
      </aside>
    </main>
    <footer>Aucun réseau requis pour jouer. Interface tactile paysage.</footer>
  </div>`;
}
