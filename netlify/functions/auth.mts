import { getDatabase } from "@netlify/database";
import type { Config, Context } from "@netlify/functions";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { clearSessionCookie, getSessionUser, hashToken, parseCookies, sessionCookie, SESSION_COOKIE } from "./_auth.mts";

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function makePassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function validPassword(password: string, salt: string, storedHash: string) {
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(storedHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function createSession(userId: string) {
  const db = getDatabase();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  await db.sql`
    INSERT INTO auth_sessions (token_hash, user_id, expires_at)
    VALUES (${tokenHash}, ${userId}, NOW() + INTERVAL '7 days')
  `;
  return token;
}

export default async (req: Request, _context: Context) => {
  const db = getDatabase();
  try {
    if (req.method === "GET") {
      await db.sql`DELETE FROM auth_sessions WHERE expires_at <= NOW()`;
      const countRows = await db.sql`SELECT COUNT(*)::int AS count FROM app_users`;
      const user = await getSessionUser(req);
      return Response.json({ configured: Number((countRows[0] as any)?.count ?? 0) > 0, user }, { headers: { "Cache-Control": "no-store" } });
    }

    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const body: any = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "setup") {
      const countRows = await db.sql`SELECT COUNT(*)::int AS count FROM app_users`;
      if (Number((countRows[0] as any)?.count ?? 0) > 0) return Response.json({ error: "Already configured" }, { status: 409 });
      const name = String(body?.name ?? "").trim();
      const email = normalizeEmail(body?.email);
      const password = String(body?.password ?? "");
      if (name.length < 2 || !email.includes("@") || password.length < 8) {
        return Response.json({ error: "Invalid setup data" }, { status: 400 });
      }
      const { salt, hash } = makePassword(password);
      const userId = randomUUID();
      await db.sql`
        INSERT INTO app_users (id, email, full_name, password_salt, password_hash, role, last_login_at)
        VALUES (${userId}, ${email}, ${name}, ${salt}, ${hash}, 'admin', NOW())
      `;
      const token = await createSession(userId);
      return Response.json({ ok: true, user: { id: userId, email, name, role: "admin" } }, { headers: { "Set-Cookie": sessionCookie(token), "Cache-Control": "no-store" } });
    }

    if (action === "login") {
      const email = normalizeEmail(body?.email);
      const password = String(body?.password ?? "");
      const rows = await db.sql`SELECT id, email, full_name, role, password_salt, password_hash FROM app_users WHERE email = ${email} LIMIT 1`;
      const u: any = rows[0];
      if (!u || !validPassword(password, u.password_salt, u.password_hash)) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }
      await db.sql`UPDATE app_users SET last_login_at = NOW() WHERE id = ${u.id}`;
      const token = await createSession(u.id);
      return Response.json({ ok: true, user: { id: u.id, email: u.email, name: u.full_name, role: u.role } }, { headers: { "Set-Cookie": sessionCookie(token), "Cache-Control": "no-store" } });
    }

    if (action === "logout") {
      const token = parseCookies(req)[SESSION_COOKIE];
      if (token) await db.sql`DELETE FROM auth_sessions WHERE token_hash = ${hashToken(token)}`;
      return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie(), "Cache-Control": "no-store" } });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Authentication operation failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/auth",
};
