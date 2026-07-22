import { readFile, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import {
  parseContentManifest,
  parseDungeon,
  parseTacticalRoom,
} from "@gargotte/content-schema";
import { assetBudgets, validateRuntimeAssetManifest } from "@gargotte/renderer";

const packDirectory = resolve("content/bastognac");
const manifest = parseContentManifest(
  JSON.parse(await readFile(resolve(packDirectory, "manifest.json"), "utf8")),
);
const dungeon = parseDungeon(
  JSON.parse(await readFile(resolve(packDirectory, "dungeon.json"), "utf8")),
);
const room = parseTacticalRoom(
  JSON.parse(
    await readFile(resolve(packDirectory, "sprint-1-room.json"), "utf8"),
  ),
);
if (!manifest.files.includes("dungeon.json"))
  throw new Error("Le manifeste Bastognac ne référence pas dungeon.json.");
if (manifest.packId !== dungeon.id)
  throw new Error(`Pack incohérent: ${manifest.packId} ≠ ${dungeon.id}.`);

const root = resolve("apps/game/public");
const assetManifestPath = resolve(root, "assets/isometric/manifest.json");
const assetManifest = validateRuntimeAssetManifest(
  JSON.parse(await readFile(assetManifestPath, "utf8")),
);
let total = 0;
for (const asset of assetManifest.assets) {
  const file = resolve(root, asset.path);
  const safe = relative(root, file);
  if (safe.startsWith("..") || safe.includes(`..${sep}`))
    throw new Error(
      `${asset.id}: chemin hors dossier public interdit (${asset.path}).`,
    );
  if (!assetBudgets.allowedFormats.includes(asset.format))
    throw new Error(`${asset.id}: format interdit ${asset.format}.`);
  if (asset.path.toLowerCase().match(/\.(pdf|psd|png)$/))
    throw new Error(
      `${asset.id}: source maître ou PNG lourd interdit (${asset.path}).`,
    );
  const size = (
    await stat(file).catch(() => {
      throw new Error(
        `${asset.id}: fichier obligatoire absent (${asset.path}).`,
      );
    })
  ).size;
  if (asset.required && size <= 0)
    throw new Error(`${asset.id}: fichier obligatoire vide.`);
  if (size > asset.budgetBytes)
    throw new Error(
      `${asset.id}: poids ${size} > budget ${asset.budgetBytes}.`,
    );
  if (
    asset.category === "character" &&
    asset.budgetBytes > assetBudgets.spritePilotBytes
  )
    throw new Error(`${asset.id}: budget sprite pilote trop élevé.`);
  if (
    asset.category !== "character" &&
    asset.budgetBytes > assetBudgets.technicalAssetBytes
  )
    throw new Error(`${asset.id}: budget asset technique trop élevé.`);
  total += size;
}
if (total > assetBudgets.pilotTotalBytes)
  throw new Error(
    `Lot pilote 2B.1: poids total ${total} > ${assetBudgets.pilotTotalBytes}.`,
  );
console.log(
  `Contenu valide: ${dungeon.name} · schéma ${manifest.schemaVersion} · salle ${room.grid.width}x${room.grid.height} · assets isométriques ${assetManifest.assets.length}/${total} octets.`,
);
