import { sb, sessionUser, setSessionCookies, clearSessionCookies } from './_supabase.js';

const json = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const session = await sessionUser(req, res);
      return json(res, 200, { configured: true, user: session?.user || null });
    }

    if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' });
    const body = req.body || {};
    const action = String(body.action || '');

    if (action === 'setup') return json(res, 409, { error: 'Administrator already configured' });

    if (action === 'logout') {
      const session = await sessionUser(req, res).catch(() => null);
      if (session?.access) await sb('/auth/v1/logout', { method:'POST', token:session.access }).catch(() => null);
      clearSessionCookies(res);
      return json(res, 200, { ok: true });
    }

    if (action !== 'login') return json(res, 400, { error: 'Invalid action' });
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) return json(res, 400, { error: 'Email and password are required' });

    const login = await sb('/auth/v1/token?grant_type=password', { method:'POST', body:{ email, password } });
    if (!login.response.ok || !login.data?.access_token || !login.data?.user) {
      return json(res, 401, { error: 'Invalid credentials' });
    }

    const { profileFor } = await import('./_supabase.js');
    const user = await profileFor(login.data.access_token, login.data.user);
    if (!user) return json(res, 401, { error: 'Inactive user' });

    setSessionCookies(res, login.data);
    await sb(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, {
      method:'PATCH', token:login.data.access_token,
      body:{ last_login_at:new Date().toISOString() },
      headers:{ Prefer:'return=minimal' }
    }).catch(() => null);

    return json(res, 200, { ok: true, user:{ ...user, lastLoginAt:new Date().toISOString() } });
  } catch (error) {
    console.error('auth error', error);
    return json(res, 500, { error: 'Authentication service failed' });
  }
}
