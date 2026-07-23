import { Container, Graphics, Text } from "pixi.js";
import type { CreatureInstance, HeroState } from "@gargotte/engine";
import tokens from "../../../../design/isometric/tokens.json";
import { assetStatusKey } from "../catalog";
import { isometricPlaceholderTokenGeometry, stableDepth } from "../projection";
import { addAssetSprite } from "./asset-sprite";
import type { SceneRenderContext } from "./context";
import { combatantHitArea } from "./primitives";

export function drawCombatant(
  context: SceneRenderContext,
  combatant: CreatureInstance | HeroState,
  active: boolean,
  attackable: boolean,
  tieBreaker: number,
): void {
  const screen = context.projectedPosition(combatant.position);
  const token = new Container();
  token.eventMode = "static";
  token.cursor = "pointer";
  token.hitArea = combatantHitArea;
  token.label = `${combatant.kind}:${combatant.id}`;
  token.zIndex = stableDepth(
    screen.y,
    context.projection.tileHeight,
    200 + tieBreaker,
  );
  token.on("pointertap", () =>
    combatant.kind === "hero"
      ? context.listeners.hero.forEach((listener) => listener(combatant.id))
      : context.listeners.enemy.forEach((listener) => listener(combatant.id)),
  );

  const shadow = new Graphics()
    .ellipse(
      0,
      isometricPlaceholderTokenGeometry.shadowCenterY,
      isometricPlaceholderTokenGeometry.shadowRadiusX,
      isometricPlaceholderTokenGeometry.shadowRadiusY,
    )
    .fill({ color: 0x000000, alpha: tokens.opacity.shadow });
  const body = new Graphics()
    .circle(
      0,
      isometricPlaceholderTokenGeometry.bodyCenterY,
      isometricPlaceholderTokenGeometry.bodyRadius,
    )
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
  label.position.set(0, isometricPlaceholderTokenGeometry.labelCenterY);
  const hp = new Text({
    text: `${combatant.hp}/${combatant.maxHp}`,
    style: { fill: 0xf8ecd2, fontSize: 12, fontWeight: "700" },
  });
  hp.anchor.set(0.5);
  hp.position.set(0, isometricPlaceholderTokenGeometry.hpCenterY);
  token.addChild(shadow, body, label, hp);
  token.position.set(screen.x, screen.y);
  context.layers.object.addChild(token);

  const groundShadowAssetId = context.catalog.groundShadowAssetId;
  if (groundShadowAssetId)
    void addAssetSprite(context, {
      assetId: groundShadowAssetId,
      environmentStatusKey: assetStatusKey(groundShadowAssetId),
      container: token,
      insertAt: 0,
      configure(sprite, asset, mirrored) {
        const scaleX = 60 / asset.dimensions.width;
        const scaleY = 20 / asset.dimensions.height;
        sprite.scale.set(mirrored ? -scaleX : scaleX, scaleY);
        sprite.position.set(0, 0);
      },
      onLoaded() {
        shadow.visible = false;
      },
    }).catch((error: unknown) => {
      if (!context.isCurrent(token)) return;
      console.error(`[assets] ombre échouée: ${groundShadowAssetId}`, error);
    });

  const assetKey =
    combatant.kind === "enemy" ? combatant.creatureId : combatant.id;
  const assetId = context.catalog.combatantAssetIds[assetKey];
  if (!assetId) return;
  void addAssetSprite(context, {
    assetId,
    orientation: "south-east",
    combatantId: combatant.id,
    container: token,
    insertAt: 1,
    configure(sprite, asset, mirrored) {
      const targetHeight = context.catalog.characterTargetHeight ?? 96;
      const scale = targetHeight / asset.dimensions.height;
      sprite.scale.set(mirrored ? -scale : scale, scale);
      sprite.position.set(0, 0);
    },
    onLoaded() {
      body.visible = false;
      label.visible = false;
    },
  }).catch((error: unknown) => {
    if (!context.isCurrent(token)) return;
    console.error(`[assets] sprite échoué: ${combatant.id}`, error);
  });
}
