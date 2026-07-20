import { Application, Container, Graphics, Text } from 'pixi.js';

export interface TabletopRenderer {
  destroy(): void;
  setExpeditionActive(active: boolean): void;
}

export async function createTabletopRenderer(host: HTMLElement): Promise<TabletopRenderer> {
  const application = new Application();
  await application.init({
    resizeTo: host,
    antialias: true,
    background: '#17100d',
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true
  });

  application.canvas.setAttribute('aria-label', 'Aperçu animé du plateau de Bastognac');
  application.canvas.setAttribute('role', 'img');
  host.replaceChildren(application.canvas);

  const stage = new Container();
  application.stage.addChild(stage);

  const board = new Graphics()
    .roundRect(0, 0, 760, 430, 28)
    .fill({ color: '#2a1d18' })
    .stroke({ color: '#806044', width: 5 });
  stage.addChild(board);

  const grid = new Graphics();
  for (let column = 0; column <= 8; column += 1) {
    grid.moveTo(55 + column * 82, 48).lineTo(55 + column * 82, 376);
  }
  for (let row = 0; row <= 4; row += 1) {
    grid.moveTo(55, 48 + row * 82).lineTo(711, 48 + row * 82);
  }
  grid.stroke({ color: '#6a4b38', width: 2, alpha: 0.62 });
  stage.addChild(grid);

  const title = new Text({
    text: 'BASTOGNAC · TABLE DE PRÉPARATION',
    style: {
      fill: '#f1c86f',
      fontFamily: 'Georgia, serif',
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: 2
    }
  });
  title.position.set(56, 13);
  stage.addChild(title);

  const heroes = [
    { x: 138, y: 253, color: '#d67b50', label: 'B' },
    { x: 220, y: 171, color: '#8cc5c7', label: 'A' },
    { x: 220, y: 335, color: '#c49ac9', label: 'M' },
    { x: 302, y: 253, color: '#d7b568', label: 'G' }
  ];

  const heroTokens: Container[] = heroes.map((hero) => {
    const token = new Container();
    const shadow = new Graphics().circle(4, 7, 29).fill({ color: '#000000', alpha: 0.35 });
    const disc = new Graphics()
      .circle(0, 0, 27)
      .fill({ color: hero.color })
      .stroke({ color: '#f8ecd2', width: 4 });
    const label = new Text({
      text: hero.label,
      style: { fill: '#20140f', fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: '700' }
    });
    label.anchor.set(0.5);
    token.addChild(shadow, disc, label);
    token.position.set(hero.x, hero.y);
    stage.addChild(token);
    return token;
  });

  const enemy = new Container();
  const enemyDisc = new Graphics()
    .circle(0, 0, 34)
    .fill({ color: '#637f37' })
    .stroke({ color: '#d45f57', width: 5 });
  const enemyLabel = new Text({
    text: 'GB',
    style: { fill: '#f8ecd2', fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: '700' }
  });
  enemyLabel.anchor.set(0.5);
  enemy.addChild(enemyDisc, enemyLabel);
  enemy.position.set(630, 253);
  stage.addChild(enemy);

  const barrel = new Graphics()
    .roundRect(-22, -29, 44, 58, 12)
    .fill({ color: '#8b5a2b' })
    .stroke({ color: '#d7a257', width: 4 });
  barrel.position.set(466, 171);
  stage.addChild(barrel);

  let expeditionActive = false;
  let elapsed = 0;
  application.ticker.add((ticker) => {
    elapsed += ticker.deltaTime / 60;
    heroTokens.forEach((token, index) => {
      token.y += Math.sin(elapsed * 2.1 + index) * 0.07;
    });
    enemy.rotation = Math.sin(elapsed * 1.5) * 0.035;
    barrel.rotation = expeditionActive ? elapsed * 0.25 : Math.sin(elapsed) * 0.025;
  });

  const resize = () => {
    const scale = Math.min(host.clientWidth / 760, host.clientHeight / 430);
    stage.scale.set(scale);
    stage.position.set(
      Math.max(0, (host.clientWidth - 760 * scale) / 2),
      Math.max(0, (host.clientHeight - 430 * scale) / 2)
    );
  };

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  return {
    destroy() {
      observer.disconnect();
      application.destroy(true, { children: true });
    },
    setExpeditionActive(active: boolean) {
      expeditionActive = active;
      enemyDisc.tint = active ? 0xffffff : 0xc7c7c7;
    }
  };
}
