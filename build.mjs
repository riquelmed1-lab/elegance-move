import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const chunkNames = Array.from({ length: 9 }, (_, i) => `frontend/chunks/${String(i).padStart(3, '0')}.b64`);
const parts = [];
for (const file of chunkNames) parts.push((await readFile(file, 'utf8')).trim());
const encoded = parts.join('');
const sha = (value) => createHash('sha256').update(value).digest('hex');

const encodedHash = sha(encoded);
if (encodedHash !== '534e1f18d52003493250ff890c7530586234c5c812df01d2fa3d9baf8b8032fc') {
  throw new Error(`Frontend base64 corrompido: ${encodedHash}`);
}

const html = gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
const htmlHash = sha(html);
if (htmlHash !== 'f14fe9195294d9ceee80fd2da1a4675ff6886ad294184019a553b0d26aaf2690') {
  throw new Error(`Frontend HTML corrompido: ${htmlHash}`);
}

for (const marker of ['<!doctype html', 'src="/auth.js"', '/api/state', 'em-cloud-cache-v1', 'window.showApp=showApp', 'auth-pending']) {
  if (!html.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Frontend inválido: marcador ausente ${marker}`);
}

const authJs = await readFile('public/auth.js', 'utf8');
if (!authJs.includes('/api/auth') || !authJs.includes("action:'login'") || !authJs.includes("action:'setup'")) {
  throw new Error('auth.js inválido ou incompleto');
}

for (const file of [
  'netlify/functions/auth.mts',
  'netlify/functions/_auth.mts',
  'netlify/functions/state.mts',
  'netlify/database/migrations/001_initial_schema/migration.sql',
  'netlify/database/migrations/002_auth/migration.sql'
]) {
  const contents = await readFile(file, 'utf8');
  if (!contents.trim()) throw new Error(`Arquivo obrigatório vazio: ${file}`);
}

await mkdir('public', { recursive: true });
await writeFile('public/index.html', html, 'utf8');
console.log('BUILD_OK', { htmlBytes: Buffer.byteLength(html), htmlHash, encodedHash, chunks: chunkNames.length });
