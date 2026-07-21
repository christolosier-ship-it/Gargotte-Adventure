export interface GridPosition {
  column: number;
  row: number;
}
export type RoomPhase = "heroes-turn" | "enemy-turn" | "victory" | "defeat";
export interface Combatant {
  id: string;
  name: string;
  kind: "hero" | "enemy";
  position: GridPosition;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  range: number;
  alive: boolean;
  blocksMovement: boolean;
}
export interface HeroState extends Combatant {
  kind: "hero";
  actionsRemaining: number;
  activationCompleted: boolean;
}
export interface RoomState {
  version: 1;
  scenarioId: string;
  width: number;
  height: number;
  obstacles: GridPosition[];
  heroes: HeroState[];
  enemies: Combatant[];
  activeHeroId: string | null;
  phase: RoomPhase;
  turn: number;
}
