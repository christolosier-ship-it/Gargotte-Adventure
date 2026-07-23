import { BUILD_LABEL } from "@gargotte/common";
import { createTabletopRenderer } from "@gargotte/renderer";
import { createGameShell } from "@gargotte/ui";
import {
  bastognacAssetCatalog,
  bastognacBrouhahaEffects,
  bastognacCreatureDefinitions,
  bastognacDungeon,
  bastognacRoom,
} from "./bastognac";
import { GameController } from "./game-controller";
import { restoreSession } from "./persistence-controller";
import { registerPwaInstall } from "./pwa-install";

export async function bootstrapGame(root: HTMLElement): Promise<void> {
  const defaultHeroId = bastognacRoom.heroes[0]?.id;
  if (!defaultHeroId)
    throw new Error("Aucun héros disponible dans le scénario.");
  const validHeroIds = new Set(bastognacRoom.heroes.map((hero) => hero.id));
  const shell = createGameShell(
    root,
    bastognacRoom.heroes.map((hero) => ({ id: hero.id, name: hero.name })),
    BUILD_LABEL,
  );
  shell.startButton.disabled = true;

  const [renderer, restored] = await Promise.all([
    createTabletopRenderer(shell.boardHost, bastognacAssetCatalog),
    restoreSession(validHeroIds, defaultHeroId),
  ]);
  const controller = new GameController({
    shell,
    renderer,
    dungeon: bastognacDungeon,
    roomDefinition: bastognacRoom,
    creatureDefinitions: bastognacCreatureDefinitions,
    brouhahaEffects: bastognacBrouhahaEffects,
    restored,
  });
  registerPwaInstall(shell);
  controller.start();
}
