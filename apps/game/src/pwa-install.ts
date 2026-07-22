import type { GameShell } from "@gargotte/ui";

export function registerPwaInstall(shell: GameShell): void {
  let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    shell.installButton.hidden = false;
  });

  shell.installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    deferredInstallPrompt = null;
    shell.installButton.hidden = true;
  });

  window.addEventListener("appinstalled", () =>
    shell.appendEvent("Gargotte Adventure est installé sur l’appareil."),
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
  }
}
