import type { GamePhase, RoomPhase } from "@gargotte/engine";

export interface HeroOption {
  id: string;
  name: string;
}

export interface GameShellUpdate {
  phase: GamePhase;
  tacticalPhase?: RoomPhase | null;
  expeditionNumber: number;
  canContinue: boolean;
  canRotateCamera?: boolean;
  cameraRotation?: number;
  saveText: string;
  actions?: number;
  activeHero?: string | null;
  selectedHeroIds?: string[];
  brouhahaLevel?: number;
  brouhahaMax?: number;
  brouhahaEffects?: string[];
}

export interface GameShell {
  boardHost: HTMLElement;
  status: HTMLElement;
  saveStatus: HTMLElement;
  cameraStatus: HTMLElement;
  eventLog: HTMLElement;
  startButton: HTMLButtonElement;
  continueButton: HTMLButtonElement;
  rotateCameraButton: HTMLButtonElement;
  installButton: HTMLButtonElement;
  heroPicker: HTMLElement;
  tacticalActions: HTMLElement;
  hud: HTMLElement;
  endActivationButton: HTMLButtonElement;
  endHeroesTurnButton: HTMLButtonElement;
  resolveEnemyTurnButton: HTMLButtonElement;
  update(state: GameShellUpdate): void;
  appendEvent(message: string): void;
}
