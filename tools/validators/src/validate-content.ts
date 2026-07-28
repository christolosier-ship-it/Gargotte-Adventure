import { readFile, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import {
  parseBrouhahaEffectCatalog,
  parseContentManifest,
  parseCreatureCatalog,
  parseDungeon,
  parseExpeditionDefinition,
  parseInteractableCatalog,
  parseTacticalRoom,
  type TacticalRoomDefinition,
} from "@gargotte/content-schema";
import { assetBudgets, validateRuntimeAssetManifest } from "@gargotte/renderer";

const packDirectory = resolve("content/bastognac");
const readJson = async (name: string): Promise<unknown> =>
  JSON.parse(await readFile(resolve(packDirectory, name), "utf8"));

const manifest = parseContentManifest(await readJson("manifest.json"));
const dungeon = parseDungeon(await readJson("dungeon.json"));
const expedition = parseExpeditionDefinition(await readJson("expedition.json"));
const creatureCatalog = parseCreatureCatalog(await readJson("creatures.json"));
const brouhahaCatalog = parseBrouhahaEffectCatalog(
  await readJson("brouhaha-effects.json"),
);
const interactableCatalog = parseInteractableCatalog(
  await readJson("interactables.json"),
);
const roomFiles = ["room-1.json", "room-2.json", "room-3.json"] as const;
const rooms = await Promise.all(
  roomFiles.map(async (file) => parseTacticalRoom(await readJson(file))),
);

for (const required of [
  "dungeon.json",
  "creatures.json",
  "brouhaha-effects.json",
  "interactables.json",
  "sprint-1-room.json",
  "expedition.json",
  ...roomFiles,
])
  if (!manifest.files.includes(required))
    throw new Error(`Le manifeste Bastognac ne référence pas ${required}.`);
if (manifest.packId !== dungeon.id)
  throw new Error(`Pack incohérent: ${manifest.packId} ≠ ${dungeon.id}.`);

const roomsById = new Map(rooms.map((room) => [room.id, room]));
if (expedition.roomIds.some((id) => !roomsById.has(id)))
  throw new Error("L’expédition référence une salle tactique absente.");
if (rooms.some((room, index) => room.id !== expedition.roomIds[index]))
  throw new Error("L’ordre des fichiers de salle diverge de l’expédition.");

const firstHeroIds = rooms[0]!.heroes.map((hero) => hero.id);
for (const room of rooms)
  if (
    room.heroes.length !== firstHeroIds.length ||
    room.heroes.some((hero, index) => hero.id !== firstHeroIds[index])
  )
    throw new Error(`${room.id}: catalogue de héros incohérent.`);

const creatureIds = new Set(
  creatureCatalog.creatures.map((creature) => creature.id),
);
const interactablesById = new Map(
  interactableCatalog.interactables.map((definition) => [
    definition.id,
    definition,
  ]),
);
for (const room of rooms)
  validateRoomReferences(room, creatureIds, interactablesById);

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
  `Contenu valide: ${dungeon.name} · expédition ${expedition.name} · ${rooms.length} salles · ${creatureCatalog.creatures.length} créatures · ${brouhahaCatalog.effects.length} effets · ${interactableCatalog.interactables.length} objets · ${rooms.reduce((sum, room) => sum + room.initialSpawns.length, 0)} populations initiales · assets ${assetManifest.assets.length}/${total} octets.`,
);

function validateRoomReferences(
  room: TacticalRoomDefinition,
  creatureIds: ReadonlySet<string>,
  interactablesById: ReadonlyMap<
    string,
    (typeof interactableCatalog.interactables)[number]
  >,
): void {
  for (const spawn of [
    ...room.initialSpawns,
    ...room.scriptedSpawns,
    ...room.brouhahaReinforcements,
  ])
    if (!creatureIds.has(spawn.creatureId))
      throw new Error(
        `${room.id}/${spawn.id}: créature absente ${spawn.creatureId}.`,
      );

  const placementsById = new Map(
    room.interactables.map((placement) => [placement.id, placement]),
  );
  for (const placement of room.interactables) {
    const definition = interactablesById.get(placement.interactableId);
    if (!definition)
      throw new Error(
        `${room.id}/${placement.id}: définition absente ${placement.interactableId}.`,
      );
    if (!definition.states.some((state) => state.id === placement.stateId))
      throw new Error(
        `${room.id}/${placement.id}: état absent ${placement.stateId}.`,
      );
  }

  for (const reaction of room.chainReactions) {
    if (!placementsById.has(reaction.trigger.interactableInstanceId))
      throw new Error(
        `${room.id}/${reaction.id}: déclencheur absent ${reaction.trigger.interactableInstanceId}.`,
      );
    for (const action of reaction.actions) {
      if (action.type === "brouhaha") continue;
      const targetId =
        action.type === "damage"
          ? action.centerInstanceId
          : action.targetInstanceId;
      const placement = placementsById.get(targetId);
      if (!placement)
        throw new Error(
          `${room.id}/${reaction.id}: cible absente ${targetId}.`,
        );
      if (action.type !== "transition") continue;
      const definition = interactablesById.get(placement.interactableId);
      const interaction = definition?.interactions.find(
        (candidate) => candidate.id === action.interactionId,
      );
      if (!interaction)
        throw new Error(
          `${room.id}/${reaction.id}: interaction absente ${targetId}/${action.interactionId}.`,
        );
      if (interaction.movement)
        throw new Error(
          `${room.id}/${reaction.id}: une transition propagée ne peut pas pousser ${targetId}.`,
        );
    }
  }
}
