import { readFile, writeFile } from 'node:fs/promises';

const indexPath = 'public/index.html';
const activationPath = 'public/supabase-activation.js';
const configPath = 'public/supabase-config.js';

let html = await readFile(indexPath, 'utf8');
const activation = await readFile(activationPath, 'utf8');
await readFile(configPath, 'utf8');

for (const marker of ['claim_first_admin','activateSupabaseBtn','/auth/v1/signup','/auth/v1/token?grant_type=password']) {
  if (!activation.includes(marker)) throw new Error(`supabase-activation.js inválido: marcador ausente ${marker}`);
}

const bodyClose = html.lastIndexOf('</body>');
if (bodyClose < 0) throw new Error('index.html inválido: </body> não encontrado');

const tags = [];
if (!html.includes('src="/supabase-config.js"')) tags.push('<script src="/supabase-config.js"></script>');
if (!html.includes('src="/supabase-activation.js"')) tags.push('<script src="/supabase-activation.js"></script>');
if (tags.length) html = html.slice(0, bodyClose) + tags.join('') + html.slice(bodyClose);

for (const marker of ['src="/supabase-config.js"','src="/supabase-activation.js"']) {
  if (!html.includes(marker)) throw new Error(`Falha ao injetar ${marker}`);
}

await writeFile(indexPath, html, 'utf8');
console.log('SUPABASE_ACTIVATION_UI_OK', { activationBytes: Buffer.byteLength(activation), indexBytes: Buffer.byteLength(html) });
