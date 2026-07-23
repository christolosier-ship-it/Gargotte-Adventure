import "virtual:pwa-register";
import "./styles.css";
import "./theme.css";
import "./layout.css";
import { bootstrapGame } from "./bootstrap";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Point de montage #app introuvable.");

await bootstrapGame(root);
