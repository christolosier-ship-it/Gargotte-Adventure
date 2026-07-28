import "virtual:pwa-register";
import "./styles.css";
import "./theme.css";
import "./layout.css";
import "./presentation.css";
import "./expedition.css";
import { bootstrapGame } from "./bootstrap";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Point de montage #app introuvable.");

try {
  await bootstrapGame(root);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[bootstrap] initialisation échouée", error);
  const status = root.querySelector<HTMLElement>("[data-save-status]");
  if (status) status.textContent = `Échec d’initialisation : ${message}`;
}
