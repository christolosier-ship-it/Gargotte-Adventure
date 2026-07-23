import { readFile, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import {
  parseBrouhahaEffectCatalog,
  parseContentManifest,
  parseCreatureCatalog,
  parseDungeon,
  parseInteractableCatalog,
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
const creatureCatalog = parseCreatureCatalog(
  JSON.parse(await readFile(resolve(packDirectory, "creatures.json"), "utf8")),
);
const brouhahaCatalog = parseBrouhahaEffectCatalog(
  JSON.parse(
    await readFile(resolve(packDirectory, "brouhaha-effects.json"), "utf8"),
  ),
);
const interactableCatalog = parseInteractableCatalog(
  JSON.parse(
    await readFile(resolve(packDirectory, "interactables.json"), "utf8"),
  ),
);
const room = parseTacticalRoom(
  JSON.parse(
    await readFile(resolve(packDirectory, "sprint-1-room.json"), "utf8"),
  ),
);

for (const required of [
  "dungeon.json",
  "creatures.json",
  "brouhaha-effects.json",
  "interactables.json",
  "sprint-1-room.json",
])
  if (!manifest.files.includes(required))
    throw new Error(`Le manifeste Bastognac ne référence pas ${required}.`);
if (manifest.packId !== dungeon.id)
  throw new Error(`Pack incohérent: ${manifest.packId} ≠ ${dungeon.id}.`);

const creatureIds = new Set(
  creatureCatalog.creatures.map((creature) => creature.id),
);
for (const enemy of room.enemies)
  if (!creatureIds.has(enemy.creatureId))
    throw new Error(
      `Instance ${enemy.id}: créature absente ${enemy.creatureId}.`,
    );
for (const scripted of room.scriptedSpawns)
  if (!creatureIds.has(scripted.creatureId))
    throw new Error(
      `Spawn ${scripted.id}: créature absente ${scripted.creatureId}.`,
    );

const interactablesById = new Map(
  interactableCatalog.interactables.map((definition) => [
    definition.id,
    definition,
  ]),
);
const placementsById = new Map(
  room.interactables.map((placement) => [placement.id, placement]),
);
for (const placement of room.interactables) {
  const definition = interactablesById.get(placement.interactableId);
  if (!definition)
    throw new Error(
      `Objet ${placement.id}: définition absente ${placement.interactableId}.`,
    );
  if (!definition.states.some((state) => state.id === placement.stateId))
    throw new Error(
      `Objet ${placement.id}: état absent ${placement.stateId} dans ${definition.id}.`,
    );
}

for (const reaction of room.chainReactions) {
  if (!placementsById.has(reaction.trigger.interactableInstanceId))
    throw new Error(
      `Réaction ${reaction.id}: déclencheur absent ${reaction.trigger.interactableInstanceId}.`,
    );
  for (const action of reaction.actions) {
    if (action.type === "brouhaha") continue;
    const targetId =
      action.type === "damage" ? action.centerInstanceId : action.targetInstanceId;
    const placement = placementsById.get(targetId);
    if (!placement)
      throw new Error(`Réaction ${reaction.id}: cible absente ${targetId}.`);
    if (action.type !== "transition") continue;
    const definition = interactablesById.get(placement.interactableId);
    const interaction = definition?.interactions.find(
      (candidate) => candidate.id === action.interactionId,
    );
    if (!interaction)
      throw new Error(
        `Réaction ${reaction.id}: interaction absente ${targetId}/${action.interactionId}.`,
      );
    if (interaction.movement)
      throw new Error(
        `Réaction ${reaction.id}: une transition propagée ne peut pas pousser ${targetId}.`,
      );
  }
}

const dungeonScopedEffects = brouhahaCatalog.effects.filter(
  (effect) => effect.scope.type === "dungeon",
);
for (const effect of dungeonScopedEffects)
  if (effect.scope.type === "dungeon" && effect.scope.dungeonId !== dungeon.id)
    throw new Error(
      `Effet ${effect.id}: donjon absent ${effect.scope.dungeonId}.`,
    );

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
  `Contenu valide: ${dungeon.name} · schéma ${manifest.schemaVersion} · ${creatureCatalog.creatures.length} créatures · ${brouhahaCatalog.effects.length} effets de Brouhaha · ${interactableCatalog.interactables.length} objets · ${room.chainReactions.length} réactions · salle ${room.grid.width}x${room.grid.height} · ${room.spawnPoints.length} points de spawn · assets isométriques ${assetManifest.assets.length}/${total} octets.`,
);
