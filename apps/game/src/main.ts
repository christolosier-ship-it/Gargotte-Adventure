import "virtual:pwa-register";
import "./styles.css";
import { bootstrapGame } from "./bootstrap";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Point de montage #app introuvable.");

await bootstrapGame(root);
