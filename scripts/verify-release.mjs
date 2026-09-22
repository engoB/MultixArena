import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve(import.meta.dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = message => { throw new Error(message); };

const version = JSON.parse(read('version.json')).version;
const pack = JSON.parse(read('pack.json'));
const manifest = JSON.parse(read('manifest.webmanifest'));
const index = read('index.html');
const sw = read('sw.js');

if (pack.version !== version) fail(`Versions différentes : version.json=${version}, pack.json=${pack.version}`);
if (!index.includes(`VERSION ",${JSON.stringify(version)}`) && !index.includes(version)) fail(`Version ${version} absente du jeu`);
if (!sw.includes(`multiarena-shell-${version}`)) fail(`Cache du service worker non versionné en ${version}`);
if (manifest.orientation !== 'portrait-primary') fail('Le manifeste ne verrouille pas portrait-primary');

const script = index.match(/<script[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/)?.[1];
if (!script) fail('Bundle JavaScript introuvable dans index.html');
new Function(script);

for (const marker of ['data-battle-answer', 'data-boss-answer', 'onPointerDown', 'cadenceStars', 'guardian-question']) {
  if (!index.includes(marker)) fail(`Correctif critique absent : ${marker}`);
}

let bytes = 0;
const missing = [];
for (const uri of [...Object.values(pack.img ?? {}), ...Object.values(pack.snd ?? {})]) {
  if (typeof uri !== 'string' || uri.startsWith('data:') || /^https?:/.test(uri)) continue;
  const file = path.join(root, uri.replace(/^\.\//, ''));
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) missing.push(uri);
  else bytes += fs.statSync(file).size;
}
if (missing.length) fail(`Assets manquants :\n${missing.join('\n')}`);

const indexBytes = fs.statSync(path.join(root, 'index.html')).size;
const gzipBytes = zlib.gzipSync(fs.readFileSync(path.join(root, 'index.html'))).length;
console.log(`OK Multi X Arena ${version}`);
console.log(`Bundle : ${(indexBytes / 1024).toFixed(1)} Kio (${(gzipBytes / 1024).toFixed(1)} Kio gzip)`);
console.log(`Pack actif : ${Object.keys(pack.img ?? {}).length} images, ${Object.keys(pack.snd ?? {}).length} sons, ${(bytes / 1048576).toFixed(2)} Mio`);
