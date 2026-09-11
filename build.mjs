import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const encoded = (await readFile('frontend/index.html.gz.b64', 'utf8')).trim();
if (!encoded) throw new Error('Frontend source vazio');

const html = gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
if (!html.includes('<!doctype html') && !html.includes('<!DOCTYPE html')) {
  throw new Error('Frontend source inválido: DOCTYPE ausente');
}
if (!html.includes('src="/auth.js"')) {
  throw new Error('Frontend source inválido: auth.js ausente');
}

await mkdir('public', { recursive: true });
await writeFile('public/index.html', html, 'utf8');
console.log('Elegance Move frontend local gerado:', html.length, 'bytes');
