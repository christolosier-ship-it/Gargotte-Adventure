import { Container, Graphics, Rectangle, Text, type Sprite } from "pixi.js";
import type { InteractableInstance } from "@gargotte/engine";
import tokens from "../../../../design/isometric/tokens.json";
import { stableDepth } from "../projection";
import { addAssetSprite } from "./asset-sprite";
import type { SceneRenderContext } from "./context";
import { tokenNumber } from "./primitives";

export function drawInteractable(
  context: SceneRenderContext,
  interactable: InteractableInstance,
): void {
  const screen = context.projectedPosition(interactable.position);
  const container = new Container();
  container.eventMode = "static";
  container.cursor = "pointer";
  container.hitArea = new Rectangle(-38, -78, 76, 84);
  container.label = `interactable:${interactable.id}:${interactable.stateId}`;
  container.position.set(screen.x, screen.y);
  container.zIndex = stableDepth(screen.y, context.projection.tileHeight, 80);
  container.on("pointertap", () =>
    context.listeners.interactable.forEach((listener) =>
      listener(interactable.id),
    ),
  );

  const fallback = drawFallback(interactable);
  fallback.eventMode = "none";
  container.addChild(fallback);

  const label = new Text({
    text: interactable.stateId.replaceAll("-", " "),
    style: {
      fill: 0xf5dfaa,
      fontSize: 11,
      fontWeight: "600",
      stroke: { color: 0x2a1d18, width: 3 },
    },
  });
  label.anchor.set(0.5, 0);
  label.position.set(0, 10);
  label.eventMode = "none";
  container.addChild(label);
  context.layers.object.addChild(container);

  const assetKey = `${interactable.interactableId}:${interactable.stateId}`;
  const assetId = context.catalog.interactableAssetIds?.[assetKey];
  if (!assetId) return;
  void addAssetSprite(context, {
    assetId,
    environmentStatusKey: `interactable-${interactable.id}`,
    container,
    insertAt: 1,
    configure(sprite, asset, mirrored) {
      configureInteractableSprite(context, sprite, asset.dimensions, mirrored);
    },
    onLoaded() {
      fallback.visible = false;
    },
  }).catch((error: unknown) => {
    if (!context.isCurrent(container)) return;
    console.error(
      `[assets] objet échoué: ${assetId}/${interactable.id}`,
      error,
    );
  });
}

function configureInteractableSprite(
  context: SceneRenderContext,
  sprite: Sprite,
  dimensions: { width: number; height: number },
  mirrored: boolean,
): void {
  const targetHeight = context.catalog.interactableTargetHeight ?? 72;
  const scale = targetHeight / dimensions.height;
  sprite.scale.set(mirrored ? -scale : scale, scale);
  sprite.position.set(0, 4);
}

function drawFallback(interactable: InteractableInstance): Graphics {
  const graphics = new Graphics();
  const wood = tokenNumber(tokens.color.primitive.woodMid);
  const dark = tokenNumber(tokens.color.primitive.woodDark);
  const gold = tokenNumber(tokens.color.primitive.gold);
  const stone = tokenNumber(tokens.color.primitive.stoneMid);
  const danger = tokenNumber(tokens.color.primitive.danger);
  const muted = interactable.stateId === "brise" ? 0.48 : 0.95;

  switch (interactable.kind) {
    case "table":
      if (interactable.stateId === "renversee")
        return graphics
          .roundRect(-40, -18, 80, 22, 5)
          .fill({ color: wood, alpha: muted })
          .stroke({ color: gold, width: 3 });
      return graphics
        .roundRect(-38, -48, 76, 24, 6)
        .fill({ color: wood, alpha: muted })
        .stroke({ color: gold, width: 3 })
        .rect(-30, -24, 8, 34)
        .rect(22, -24, 8, 34)
        .fill({ color: dark, alpha: muted });
    case "barrel":
      if (interactable.stateId === "brise")
        return graphics
          .poly([-38, 0, -22, -22, -3, -4, 16, -26, 38, 0])
          .fill({ color: wood, alpha: muted })
          .stroke({ color: gold, width: 3 });
      return graphics
        .roundRect(-25, -58, 50, 66, 20)
        .fill({ color: wood, alpha: muted })
        .stroke({ color: gold, width: 3 })
        .rect(-27, -43, 54, 6)
        .rect(-27, -13, 54, 6)
        .fill({ color: dark, alpha: 0.9 });
    case "gate":
      if (interactable.stateId === "ouverte")
        return graphics
          .rect(-38, -62, 8, 68)
          .rect(30, -62, 8, 68)
          .fill({ color: dark, alpha: 0.78 })
          .stroke({ color: gold, width: 2 });
      graphics.rect(-38, -62, 76, 68).stroke({ color: dark, width: 7 });
      for (const x of [-24, -8, 8, 24])
        graphics.moveTo(x, -60).lineTo(x, 4).stroke({ color: gold, width: 4 });
      return graphics;
    case "torch":
      graphics
        .rect(-4, -42, 8, 48)
        .fill({ color: dark, alpha: 0.92 })
        .stroke({ color: gold, width: 2 });
      return interactable.stateId === "allumee"
        ? graphics
            .circle(0, -52, 15)
            .fill({ color: danger, alpha: 0.9 })
            .circle(0, -56, 8)
            .fill({ color: gold, alpha: 1 })
        : graphics.circle(0, -50, 12).fill({ color: stone, alpha: 0.62 });
    case "pillar":
      graphics
        .poly([-28, 4, -22, -60, 22, -60, 28, 4])
        .fill({ color: stone, alpha: 0.95 })
        .stroke({ color: gold, width: 3 });
      if (interactable.stateId === "fissure")
        graphics
          .moveTo(-4, -55)
          .lineTo(8, -38)
          .lineTo(-3, -22)
          .lineTo(10, -6)
          .stroke({ color: dark, width: 4 });
      return graphics;
  }
}
