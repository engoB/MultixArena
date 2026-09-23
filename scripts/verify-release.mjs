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
if (!index.includes(`t.version&&t.version!==\`${version}\`&&await e.update()`)) fail(`Comparaison de mise à jour absente pour ${version}`);
if (/4\.6\.(8|9|10|11|12)/.test(index)) fail('Ancienne version 4.6.8 à 4.6.12 encore présente dans le jeu');
if (!sw.includes(`multiarena-shell-${version}`)) fail(`Cache du service worker non versionné en ${version}`);
if (manifest.orientation !== 'portrait-primary') fail('Le manifeste ne verrouille pas portrait-primary');

const script = index.match(/<script[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/)?.[1];
if (!script) fail('Bundle JavaScript introuvable dans index.html');
new Function(script);

const audioGuard = index.match(/<script id="audio-compat-guard">([\s\S]*?)<\/script>/)?.[1];
if (!audioGuard) fail('Garde audio de compatibilité introuvable');
new Function(audioGuard);

for (const marker of ['data-battle-answer', 'data-boss-answer', 'onPointerDown', 'cadenceStars', 'guardian-question']) {
  if (!index.includes(marker)) fail(`Correctif critique absent : ${marker}`);
}

for (const marker of [
  'let t=setTimeout(()=>c(s-1),s===0?700:900);return()=>clearTimeout(t)',
  'let t=window.setTimeout(()=>b(e=>e-1),y===0?650:850);return()=>window.clearTimeout(t)',
  '"aria-label":`Volume des effets et clics UI`,onInput:',
  'i=e===`tap`?.12:.26',
  '.hero-game-badge .hero-face-5{transform:none;object-position:center}',
  'window.__MULTIX_AUDIO_GUARD__',
  'effectsContext.createMediaElementSource(media)',
  'tapAttenuation',
  'if (media.loop)',
  "document.addEventListener('visibilitychange'",
  "window.addEventListener('pagehide'",
  "document.addEventListener('freeze'",
  'if (record.music) record.wasPlaying ||=',
  '.hero-thumb{overflow:hidden}',
  '.hero-thumb .hero-face{object-fit:contain!important;object-position:center!important;transform:none}',
  'children:O.map((t,n)=>{let o=pe(e,n),s=n>=7&&!o,c=N(`hero_${n}`)??N(`heroFace_${n}`)',
  'let E=e=>{ee(e)}',
  'i!==t&&r(i)',
]) {
  if (!index.includes(marker)) fail(`Correctif de régression absent : ${marker}`);
}

for (const forbidden of [
  'let e=setTimeout(()=>c(s-1),s===0?700:900);return()=>clearTimeout(e)',
  'let e=window.setTimeout(()=>b(e=>e-1),y===0?650:850);return()=>window.clearTimeout(e)',
  'i!==t&&(F.page(),r(i))',
  '.hero-thumb .hero-face{object-fit:contain!important;object-position:center;transform:scale(1.16)}',
  '.hero-thumb .hero-face-0{',
  'let E=e=>{F.denied(),ee(e)}',
]) {
  if (index.includes(forbidden)) fail(`Régression TDZ encore présente : ${forbidden}`);
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
