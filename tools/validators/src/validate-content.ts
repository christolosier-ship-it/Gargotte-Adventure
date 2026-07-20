import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseContentManifest, parseDungeon } from '@gargotte/content-schema';

const packDirectory = resolve('content/bastognac');
const manifest = parseContentManifest(
  JSON.parse(await readFile(resolve(packDirectory, 'manifest.json'), 'utf8'))
);
const dungeon = parseDungeon(
  JSON.parse(await readFile(resolve(packDirectory, 'dungeon.json'), 'utf8'))
);

if (!manifest.files.includes('dungeon.json')) {
  throw new Error('Le manifeste Bastognac ne référence pas dungeon.json.');
}

if (manifest.packId !== dungeon.id) {
  throw new Error(`Pack incohérent: ${manifest.packId} ≠ ${dungeon.id}.`);
}

console.log(
  `Contenu valide: ${dungeon.name} · schéma ${manifest.schemaVersion} · budgets ${dungeon.floorBudgets.join('/')}`
);
