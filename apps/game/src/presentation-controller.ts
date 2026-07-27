import { AudioDirector, type AudioSettings } from "@gargotte/audio";
import type {
  CreatureDefinition,
  InteractableDefinition,
  TacticalEvent,
} from "@gargotte/engine";
import { routeTacticalPresentation } from "@gargotte/presentation";
import type { TabletopRenderer } from "@gargotte/renderer";
import type { GameShell } from "@gargotte/ui";
import { describeTacticalEvent } from "./event-messages";

const audioSettingsKey = "gargotte-audio-settings-v1";

interface PresentationControllerOptions {
  shell: GameShell;
  renderer: TabletopRenderer;
  creatureDefinitions: readonly CreatureDefinition[];
  interactableDefinitions: readonly InteractableDefinition[];
}

export class PresentationController {
  readonly #shell: GameShell;
  readonly #renderer: TabletopRenderer;
  readonly #creatureDefinitions: readonly CreatureDefinition[];
  readonly #interactableDefinitions: readonly InteractableDefinition[];
  readonly #audio: AudioDirector;
  readonly #motionQuery: MediaQueryList;
  #reducedMotion: boolean;

  constructor(options: PresentationControllerOptions) {
    this.#shell = options.shell;
    this.#renderer = options.renderer;
    this.#creatureDefinitions = options.creatureDefinitions;
    this.#interactableDefinitions = options.interactableDefinitions;
    this.#audio = new AudioDirector();
    this.#audio.configure(readStoredAudioSettings());
    this.#motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.#reducedMotion = this.#motionQuery.matches;
  }

  get audioSettings(): Readonly<AudioSettings> {
    return this.#audio.settings;
  }

  get reducedMotion(): boolean {
    return this.#reducedMotion;
  }

  start(): void {
    this.#shell.muteAudioButton.addEventListener("click", () => {
      this.#audio.unlock();
      this.#audio.configure({ muted: !this.#audio.settings.muted });
      this.storeSettings();
      this.syncUi();
      this.#shell.appendEvent(
        this.#audio.settings.muted ? "Son coupé." : "Son activé.",
      );
    });
    this.#shell.volumeInput.addEventListener("input", () => {
      this.#audio.unlock();
      this.#audio.configure({
        masterVolume: Number(this.#shell.volumeInput.value),
      });
      this.storeSettings();
      this.syncUi();
    });
    this.#motionQuery.addEventListener("change", (event) => {
      this.#reducedMotion = event.matches;
      this.clear();
      this.syncUi();
      this.#shell.appendEvent(
        event.matches
          ? "Mouvement réduit activé par le système."
          : "Animations courtes réactivées par le système.",
      );
    });

    const document = this.#shell.boardHost.ownerDocument;
    const unlock = (): void => {
      this.#audio.unlock();
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      this.syncDiagnostics();
    };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    this.syncUi();
  }

  present(events: readonly TacticalEvent[]): void {
    if (events.length === 0) return;
    const batch = routeTacticalPresentation(
      events,
      (event) =>
        describeTacticalEvent(
          event,
          this.#creatureDefinitions,
          this.#interactableDefinitions,
        ),
      { reducedMotion: this.#reducedMotion },
    );
    this.#shell.appendEventGroup(batch.journal);
    this.#renderer.playPresentationCues(batch.visualCues, {
      reducedMotion: this.#reducedMotion,
    });
    void this.#audio.playCues(batch.audioCues).then((played) => {
      this.#shell.boardHost.dataset.audioPlayed = String(played);
      this.syncDiagnostics();
    });
  }

  clear(): void {
    this.#renderer.clearPresentationCues();
    this.#audio.stopAll();
    this.#shell.boardHost.dataset.audioPlayed = "0";
    this.syncDiagnostics();
  }

  private storeSettings(): void {
    try {
      localStorage.setItem(audioSettingsKey, JSON.stringify(this.#audio.settings));
    } catch {
      // Les réglages restent actifs pour la session si le stockage est indisponible.
    }
  }

  private syncUi(): void {
    this.#shell.setAudioSettings(
      this.#audio.settings.muted,
      this.#audio.settings.masterVolume,
    );
    this.#shell.reducedMotionStatus.textContent = this.#reducedMotion
      ? "Activé"
      : "Désactivé";
    this.#shell.reducedMotionStatus.dataset.active = String(
      this.#reducedMotion,
    );
    this.syncDiagnostics();
  }

  private syncDiagnostics(): void {
    this.#shell.boardHost.dataset.audioUnlocked = String(this.#audio.unlocked);
    this.#shell.boardHost.dataset.audioMuted = String(
      this.#audio.settings.muted,
    );
    this.#shell.boardHost.dataset.audioCacheSize = String(
      this.#audio.cacheSize,
    );
    this.#shell.boardHost.dataset.reducedMotion = String(
      this.#reducedMotion,
    );
  }
}

function readStoredAudioSettings(): Partial<AudioSettings> {
  try {
    const stored = localStorage.getItem(audioSettingsKey);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as Partial<AudioSettings>;
    return {
      masterVolume:
        typeof parsed.masterVolume === "number"
          ? parsed.masterVolume
          : undefined,
      muted: typeof parsed.muted === "boolean" ? parsed.muted : undefined,
    };
  } catch {
    return {};
  }
}
