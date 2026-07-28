import type {
  ExpeditionStatus,
  GamePhase,
  RoomPhase,
} from "@gargotte/engine";

export type PresentationTone = "info" | "warning" | "success" | "danger";

export interface JournalPresentationEntry {
  id: string;
  rootId: string;
  summary: string;
  details: string[];
  tone: PresentationTone;
  eventTypes: string[];
}

export interface HeroOption {
  id: string;
  name: string;
}

export interface GameShellUpdate {
  phase: GamePhase;
  tacticalPhase?: RoomPhase | null;
  expeditionStatus?: ExpeditionStatus | null;
  expeditionNumber: number;
  canStart?: boolean;
  canContinue: boolean;
  canTransition?: boolean;
  transitionLabel?: string | null;
  canReplay?: boolean;
  canRotateCamera?: boolean;
  cameraRotation?: number;
  saveText: string;
  roomName?: string | null;
  roomObjective?: string | null;
  roomProgress?: string | null;
  resultText?: string | null;
  actions?: number;
  activeHero?: string | null;
  selectedHeroIds?: string[];
  brouhahaLevel?: number;
  brouhahaMax?: number;
  brouhahaEffects?: string[];
  audioMuted?: boolean;
  audioVolume?: number;
  reducedMotion?: boolean;
  diagnosticMode?: boolean;
}

export interface GameShell {
  boardHost: HTMLElement;
  roomTitle: HTMLElement;
  roomObjective: HTMLElement;
  progressStatus: HTMLElement;
  resultPanel: HTMLElement;
  status: HTMLElement;
  saveStatus: HTMLElement;
  cameraStatus: HTMLElement;
  eventLog: HTMLElement;
  startButton: HTMLButtonElement;
  continueButton: HTMLButtonElement;
  nextRoomButton: HTMLButtonElement;
  replayButton: HTMLButtonElement;
  diagnosticToggleButton: HTMLButtonElement;
  rotateCameraButton: HTMLButtonElement;
  installButton: HTMLButtonElement;
  heroPicker: HTMLElement;
  tacticalActions: HTMLElement;
  hud: HTMLElement;
  endActivationButton: HTMLButtonElement;
  endHeroesTurnButton: HTMLButtonElement;
  resolveEnemyTurnButton: HTMLButtonElement;
  muteAudioButton: HTMLButtonElement;
  volumeInput: HTMLInputElement;
  reducedMotionStatus: HTMLElement;
  update(state: GameShellUpdate): void;
  setSaveStatus(message: string): void;
  setAudioSettings(muted: boolean, volume: number): void;
  appendEvent(message: string): void;
  appendEventGroup(entry: JournalPresentationEntry): void;
}
