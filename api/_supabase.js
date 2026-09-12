const FALLBACK_URL = 'https://fcuqorihzypcstmcgvru.supabase.co';
const FALLBACK_KEY = 'sb_publishable_sQClCX3zvC1Ja2d2Oia7qA_JtRMGZuS';

export const SUPABASE_URL = process.env.SUPABASE_URL || FALLBACK_URL;
export const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY;

export function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=');
    return [decodeURIComponent(i < 0 ? v : v.slice(0, i)), decodeURIComponent(i < 0 ? '' : v.slice(i + 1))];
  }));
}

const cookie = (name, value, maxAge) => `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export function setSessionCookies(res, session) {
  const accessMax = Math.max(60, Number(session.expires_in || 3600));
  res.setHeader('Set-Cookie', [
    cookie('em_sb_access', session.access_token || '', accessMax),
    cookie('em_sb_refresh', session.refresh_token || '', 60 * 60 * 24 * 30)
  ]);
}

export function clearSessionCookies(res) {
  res.setHeader('Set-Cookie', [cookie('em_sb_access', '', 0), cookie('em_sb_refresh', '', 0)]);
}

export async function sb(path, { method='GET', token, body, headers={} } = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { response, data };
}

export async function profileFor(token, user) {
  const { response, data } = await sb(`/rest/v1/profiles?select=id,full_name,email,role,active,last_login_at&id=eq.${encodeURIComponent(user.id)}&limit=1`, { token });
  if (!response.ok) return null;
  const p = Array.isArray(data) ? data[0] : null;
  if (!p || p.active !== true) return null;
  return {
    id: p.id,
    name: p.full_name || user.user_metadata?.full_name || user.email || 'Usuário',
    email: p.email || user.email || '',
    role: p.role || 'seller',
    active: true,
    lastLoginAt: p.last_login_at || null
  };
}

export async function sessionUser(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  let access = cookies.em_sb_access || '';
  const refresh = cookies.em_sb_refresh || '';
  if (access) {
    const { response, data } = await sb('/auth/v1/user', { token: access });
    if (response.ok && data?.id) {
      const profile = await profileFor(access, data);
      if (profile) return { user: profile, access, authUser: data };
    }
  }
  if (!refresh) return null;
  const refreshed = await sb('/auth/v1/token?grant_type=refresh_token', { method:'POST', body:{ refresh_token: refresh } });
  if (!refreshed.response.ok || !refreshed.data?.access_token) return null;
  setSessionCookies(res, refreshed.data);
  access = refreshed.data.access_token;
  const profile = await profileFor(access, refreshed.data.user);
  return profile ? { user: profile, access, authUser: refreshed.data.user } : null;
}
