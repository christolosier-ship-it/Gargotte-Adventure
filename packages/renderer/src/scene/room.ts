import { Graphics, Text } from "pixi.js";
import { samePosition, type GridPosition, type RoomState } from "@gargotte/engine";
import { defaultCameraMargins, type IsometricBounds } from "../projection";
import type { TacticalHighlights } from "../types";
import type { VisibleWallSegment } from "../view";
import { drawCombatant } from "./combatants";
import type { SceneRenderContext } from "./context";
import { drawTile, drawWall } from "./environment";
import { resolveTileState } from "./primitives";

export function renderRoomScene(
  context: SceneRenderContext,
  state: RoomState,
  highlights: TacticalHighlights,
  bounds: IsometricBounds,
  wallSegments: VisibleWallSegment[],
): void {
  const backdrop = new Graphics()
    .roundRect(
      bounds.minX - defaultCameraMargins.left,
      bounds.minY - defaultCameraMargins.top,
      bounds.width + defaultCameraMargins.left + defaultCameraMargins.right,
      bounds.height + defaultCameraMargins.top + defaultCameraMargins.bottom,
      28,
    )
    .fill({ color: 0x2a1d18 })
    .stroke({ color: 0x806044, width: 5 });
  context.layers.backdrop.addChild(backdrop);

  const title = new Text({
    text:
      state.phase === "victory"
        ? "VICTOIRE"
        : state.phase === "defeat"
          ? "DÉFAITE"
          : context.catalog.roomTitle,
    style: { fill: 0xf1c86f, fontSize: 22, fontWeight: "700" },
  });
  title.position.set(bounds.minX - 46, bounds.minY - 62);
  context.layers.interface.addChild(title);

  const attackablePositions = state.enemies
    .filter(
      (enemy) => enemy.alive && highlights.attackable.includes(enemy.id),
    )
    .map((enemy) => enemy.position);

  for (let row = 0; row < state.height; row += 1)
    for (let column = 0; column < state.width; column += 1) {
      const position: GridPosition = { column, row };
      drawTile(
        context,
        position,
        resolveTileState(
          state,
          position,
          highlights.reachable.some((candidate) =>
            samePosition(candidate, position),
          ),
          state.heroes.some(
            (hero) =>
              hero.alive &&
              hero.id === state.activeHeroId &&
              samePosition(hero.position, position),
          ),
          attackablePositions.some((candidate) =>
            samePosition(candidate, position),
          ),
        ),
      );
    }

  wallSegments.forEach((segment) => drawWall(context, segment));
  state.heroes
    .filter((candidate) => candidate.alive)
    .forEach((hero, index) =>
      drawCombatant(
        context,
        hero,
        hero.id === state.activeHeroId,
        false,
        index,
      ),
    );
  state.enemies
    .filter((candidate) => candidate.alive)
    .forEach((enemy, index) =>
      drawCombatant(
        context,
        enemy,
        false,
        highlights.attackable.includes(enemy.id),
        index,
      ),
    );
}
