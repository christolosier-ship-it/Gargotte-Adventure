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

const cellSize = 82;
const originX = 55;
const originY = 48;

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
    cell: [] as ((position: GridPosition) => void)[],
    hero: [] as ((id: string) => void)[],
    enemy: [] as ((id: string) => void)[],
  };

  function clearStage(): void {
    for (const child of stage.removeChildren())
      child.destroy({ children: true });
  }

  function drawToken(
    combatant: Combatant | HeroState,
    active: boolean,
    attackable: boolean,
  ): void {
    const x = originX + combatant.position.column * cellSize + cellSize / 2;
    const y = originY + combatant.position.row * cellSize + cellSize / 2;
    const token = new Container();
    token.eventMode = "static";
    token.cursor = "pointer";
    token.label = `${combatant.kind}:${combatant.id}`;
    token.on("pointertap", () =>
      combatant.kind === "hero"
        ? listeners.hero.forEach((listener) => listener(combatant.id))
        : listeners.enemy.forEach((listener) => listener(combatant.id)),
    );

    const tokenBody = new Graphics()
      .circle(0, 0, 27)
      .fill({ color: combatant.kind === "hero" ? 0xd7b568 : 0x637f37 })
      .stroke({
        color: active ? 0xf1c86f : attackable ? 0xd45f57 : 0xf8ecd2,
        width: 4,
      });
    const label = new Text({
      text: combatant.name.slice(0, 2).toUpperCase(),
      style: { fill: 0x20140f, fontSize: 16, fontWeight: "700" },
    });
    label.anchor.set(0.5);
    const hp = new Text({
      text: `${combatant.hp}/${combatant.maxHp}`,
      style: { fill: 0xf8ecd2, fontSize: 12, fontWeight: "700" },
    });
    hp.anchor.set(0.5);
    hp.position.set(0, 34);
    token.addChild(tokenBody, label, hp);
    token.position.set(x, y);
    stage.addChild(token);
  }

  function renderRoom(
    state: RoomState,
    highlights: TacticalHighlights = { reachable: [], attackable: [] },
  ): void {
    clearStage();
    app.canvas.dataset.phase = state.phase;
    app.canvas.dataset.turn = String(state.turn);
    app.canvas.dataset.activeHero = state.activeHeroId ?? "";
    app.canvas.dataset.heroes = JSON.stringify(
      state.heroes.map((hero) => ({
        id: hero.id,
        position: hero.position,
        hp: hero.hp,
        actionsRemaining: hero.actionsRemaining,
        activationCompleted: hero.activationCompleted,
      })),
    );
    app.canvas.dataset.enemies = JSON.stringify(
      state.enemies.map((enemy) => ({
        id: enemy.id,
        position: enemy.position,
        hp: enemy.hp,
        alive: enemy.alive,
      })),
    );

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

    for (let row = 0; row < state.height; row += 1) {
      for (let column = 0; column < state.width; column += 1) {
        const position = { column, row };
        const reachable = highlights.reachable.some(
          (candidate) => candidate.column === column && candidate.row === row,
        );
        const cell = new Graphics()
          .rect(
            originX + column * cellSize,
            originY + row * cellSize,
            cellSize,
            cellSize,
          )
          .fill({
            color: reachable ? 0x315c35 : 0x241914,
            alpha: reachable ? 0.85 : 0.25,
          })
          .stroke({ color: 0x6a4b38, width: 2 });
        cell.eventMode = "static";
        cell.cursor = "pointer";
        cell.label = `cell:${column},${row}`;
        cell.on("pointertap", () =>
          listeners.cell.forEach((listener) => listener(position)),
        );
        stage.addChild(cell);
      }
    }

    for (const obstacle of state.obstacles) {
      stage.addChild(
        new Graphics()
          .roundRect(
            originX + obstacle.column * cellSize + 16,
            originY + obstacle.row * cellSize + 16,
            50,
            50,
            10,
          )
          .fill({ color: 0x8b5a2b })
          .stroke({ color: 0xd7a257, width: 4 }),
      );
    }
    for (const hero of state.heroes.filter((candidate) => candidate.alive))
      drawToken(hero, hero.id === state.activeHeroId, false);
    for (const enemy of state.enemies.filter((candidate) => candidate.alive))
      drawToken(enemy, false, highlights.attackable.includes(enemy.id));

    host.dataset.displayObjects = String(stage.children.length);
    resize();
  }

  function resize(): void {
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
      clearStage();
      app.destroy(true, { children: true });
    },
    setExpeditionActive() {},
    renderRoom,
    onCellSelected(listener) {
      listeners.cell.push(listener);
    },
    onHeroSelected(listener) {
      listeners.hero.push(listener);
    },
    onEnemySelected(listener) {
      listeners.enemy.push(listener);
    },
  };
}
