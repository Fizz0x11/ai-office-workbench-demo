import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = {
  '/index.html':'text/html; charset=utf-8',
  '/app.js':'text/javascript; charset=utf-8',
  '/styles.css':'text/css; charset=utf-8',
  '/experience.css':'text/css; charset=utf-8',
  '/spotlight.css':'text/css; charset=utf-8',
  '/mascot.png':'image/png'
};
const packed = {};
for (const [path, type] of Object.entries(assets)) {
  packed[path] = {type, data:(await readFile(resolve(root, 'web', path.slice(1)))).toString('base64')};
}
const source = await readFile(resolve(root, 'server/index.js'), 'utf8');
const output = source.replace('const ASSETS = __ASSETS__;', `const ASSETS = ${JSON.stringify(packed)};`);
const target = resolve(root, 'dist/server/index.js');
await mkdir(dirname(target), {recursive:true});
await writeFile(target, output);
const manifestPath = resolve(root, '.openai/hosting.json');
const manifest = await readFile(manifestPath, 'utf8').then(JSON.parse, error => {
  if (error.code !== 'ENOENT') throw error;
  return {project_id:'local-demo', d1:null, r2:null};
});
if (!manifest.project_id || manifest.static) throw new Error('Worker hosting manifest required');
await mkdir(resolve(root, 'dist/.openai'), {recursive:true});
await writeFile(resolve(root, 'dist/.openai/hosting.json'), JSON.stringify(manifest));
console.log('Built authenticated Worker');
