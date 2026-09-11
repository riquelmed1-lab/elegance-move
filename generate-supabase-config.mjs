import { writeFile } from 'node:fs/promises';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';

if (!url || !key) {
  throw new Error('SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY são obrigatórias no build.');
}

const js = `window.__SUPABASE_CONFIG__ = Object.freeze(${JSON.stringify({ url, key })});\n`;
await writeFile('public/supabase-config.js', js, 'utf8');
console.log('SUPABASE_CONFIG_OK', { url, keyType: key.startsWith('sb_publishable_') ? 'publishable' : 'legacy' });
