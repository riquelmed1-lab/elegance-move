import { getDatabase } from "@netlify/database";
import { createHash } from "node:crypto";

export const SESSION_COOKIE = "em_session";

export function parseCookies(req: Request) {
  const raw = req.headers.get("cookie") || "";
  return Object.fromEntries(raw.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const idx = part.indexOf("=");
    return idx < 0 ? [part, ""] : [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
  }));
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookie(token: string, maxAge = 60 * 60 * 24 * 7) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function getSessionUser(req: Request) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const db = getDatabase();
  const tokenHash = hashToken(token);
  const rows = await db.sql`
    SELECT u.id, u.email, u.full_name, u.role
    FROM auth_sessions s
    JOIN app_users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
    LIMIT 1
  `;
  const user: any = rows[0];
  return user ? { id: user.id, email: user.email, name: user.full_name, role: user.role } : null;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}
