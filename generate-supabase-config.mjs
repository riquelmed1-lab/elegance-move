import { writeFile } from 'node:fs/promises';

const fallbackUrl = 'https://fcuqorihzypcstmcgvru.supabase.co';
const fallbackKey = 'sb_publishable_sQClCX3zvC1Ja2d2Oia7qA_JtRMGZuS';

const url = process.env.SUPABASE_URL || fallbackUrl;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || fallbackKey;

if (!url || !key) {
  throw new Error('Configuração pública do Supabase ausente.');
}

const js = `window.__SUPABASE_CONFIG__ = Object.freeze(${JSON.stringify({ url, key })});\n`;
await writeFile('public/supabase-config.js', js, 'utf8');
console.log('SUPABASE_CONFIG_OK', { url, keyType: key.startsWith('sb_publishable_') ? 'publishable' : 'legacy', source: process.env.SUPABASE_URL ? 'env' : 'fallback-public' });
