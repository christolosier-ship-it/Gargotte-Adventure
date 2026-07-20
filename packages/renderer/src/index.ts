import { Application, Container, Graphics, Text } from "pixi.js";
import type {
  Combatant,
  GridPosition,
  HeroState,
  RoomState,
} from "@gargotte/engine";
export interface TacticalHighlights {
  reachable: GridPosition[];
  attackable: string[];
}
export interface TabletopRenderer {
  destroy(): void;
  setExpeditionActive(active: boolean): void;
  renderRoom(state: RoomState, highlights?: TacticalHighlights): void;
  onCellSelected(listener: (position: GridPosition) => void): void;
  onHeroSelected(listener: (heroId: string) => void): void;
  onEnemySelected(listener: (enemyId: string) => void): void;
}
const cell = 82,
  ox = 55,
  oy = 48;
export async function createTabletopRenderer(
  host: HTMLElement,
): Promise<TabletopRenderer> {
  const app = new Application();
  await app.init({
    resizeTo: host,
    antialias: true,
    background: "#17100d",
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  app.canvas.setAttribute("aria-label", "Plateau tactique PixiJS de Bastognac");
  app.canvas.setAttribute("role", "img");
  app.canvas.tabIndex = 0;
  host.replaceChildren(app.canvas);
  const stage = new Container();
  app.stage.addChild(stage);
  const listeners = {
    cell: [] as ((p: GridPosition) => void)[],
    hero: [] as ((id: string) => void)[],
    enemy: [] as ((id: string) => void)[],
  };
  function drawToken(
    c: Combatant | HeroState,
    active: boolean,
    attackable: boolean,
  ) {
    const x = ox + c.position.column * cell + cell / 2,
      y = oy + c.position.row * cell + cell / 2;
    const token = new Container();
    token.eventMode = "static";
    token.cursor = "pointer";
    token.on("pointertap", () =>
      c.kind === "hero"
        ? listeners.hero.forEach((l) => l(c.id))
        : listeners.enemy.forEach((l) => l(c.id)),
    );
    const g = new Graphics()
      .circle(0, 0, 27)
      .fill({ color: c.kind === "hero" ? 0xd7b568 : 0x637f37 })
      .stroke({
        color: active ? 0xf1c86f : attackable ? 0xd45f57 : 0xf8ecd2,
        width: 4,
      });
    const label = new Text({
      text: c.name.slice(0, 2).toUpperCase(),
      style: { fill: 0x20140f, fontSize: 16, fontWeight: "700" },
    });
    label.anchor.set(0.5);
    const hp = new Text({
      text: `${c.hp}/${c.maxHp}`,
      style: { fill: 0xf8ecd2, fontSize: 12, fontWeight: "700" },
    });
    hp.anchor.set(0.5);
    hp.position.set(0, 34);
    token.addChild(g, label, hp);
    token.position.set(x, y);
    stage.addChild(token);
  }
  function renderRoom(
    state: RoomState,
    highlights: TacticalHighlights = { reachable: [], attackable: [] },
  ) {
    stage.removeChildren();
    stage.addChild(
      new Graphics()
        .roundRect(0, 0, 760, 430, 28)
        .fill({ color: 0x2a1d18 })
        .stroke({ color: 0x806044, width: 5 }),
    );
    const title = new Text({
      text:
        state.phase === "victory"
          ? "VICTOIRE"
          : state.phase === "defeat"
            ? "DÉFAITE"
            : "BASTOGNAC · SALLE TACTIQUE",
      style: { fill: 0xf1c86f, fontSize: 22, fontWeight: "700" },
    });
    title.position.set(56, 13);
    stage.addChild(title);
    for (let r = 0; r < state.height; r++)
      for (let c = 0; c < state.width; c++) {
        const p = { column: c, row: r };
        const h = highlights.reachable.some(
          (q) => q.column === c && q.row === r,
        );
        const g = new Graphics()
          .rect(ox + c * cell, oy + r * cell, cell, cell)
          .fill({ color: h ? 0x315c35 : 0x241914, alpha: h ? 0.85 : 0.25 })
          .stroke({ color: 0x6a4b38, width: 2 });
        g.eventMode = "static";
        g.cursor = "pointer";
        g.on("pointertap", () => listeners.cell.forEach((l) => l(p)));
        stage.addChild(g);
      }
    for (const o of state.obstacles)
      stage.addChild(
        new Graphics()
          .roundRect(
            ox + o.column * cell + 16,
            oy + o.row * cell + 16,
            50,
            50,
            10,
          )
          .fill({ color: 0x8b5a2b })
          .stroke({ color: 0xd7a257, width: 4 }),
      );
    for (const h of state.heroes.filter((h) => h.alive))
      drawToken(h, h.id === state.activeHeroId, false);
    for (const e of state.enemies.filter((e) => e.alive))
      drawToken(e, false, highlights.attackable.includes(e.id));
    resize();
  }
  function resize() {
    const scale = Math.min(host.clientWidth / 760, host.clientHeight / 430);
    stage.scale.set(scale);
    stage.position.set(
      Math.max(0, (host.clientWidth - 760 * scale) / 2),
      Math.max(0, (host.clientHeight - 430 * scale) / 2),
    );
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  return {
    destroy() {
      observer.disconnect();
      app.destroy(true, { children: true });
    },
    setExpeditionActive() {},
    renderRoom,
    onCellSelected(l) {
      listeners.cell.push(l);
    },
    onHeroSelected(l) {
      listeners.hero.push(l);
    },
    onEnemySelected(l) {
      listeners.enemy.push(l);
    },
  };
}
