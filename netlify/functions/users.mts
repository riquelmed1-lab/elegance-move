import { getDatabase } from "@netlify/database";
import type { Config, Context } from "@netlify/functions";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { forbidden, getSessionUser, unauthorized } from "./_auth.mts";

const VALID_ROLES = new Set(["admin", "manager", "seller"]);

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function makePassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function publicUser(row: any) {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

export default async (req: Request, _context: Context) => {
  const db = getDatabase();
  try {
    const current = await getSessionUser(req);
    if (!current) return unauthorized();
    if (current.role !== "admin") return forbidden();

    if (req.method === "GET") {
      const rows = await db.sql`
        SELECT id, email, full_name, role, active, created_at, updated_at, last_login_at
        FROM app_users
        ORDER BY CASE WHEN role = 'admin' THEN 0 WHEN role = 'manager' THEN 1 ELSE 2 END, full_name
      `;
      return Response.json({ users: rows.map(publicUser), currentUserId: current.id }, { headers: { "Cache-Control": "no-store" } });
    }

    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const body: any = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "create") {
      const name = String(body?.name ?? "").trim();
      const email = normalizeEmail(body?.email);
      const password = String(body?.password ?? "");
      const role = String(body?.role ?? "seller");
      if (name.length < 2 || !email.includes("@") || password.length < 8 || !VALID_ROLES.has(role)) {
        return Response.json({ error: "Invalid user data" }, { status: 400 });
      }
      const existing = await db.sql`SELECT id FROM app_users WHERE email = ${email} LIMIT 1`;
      if (existing[0]) return Response.json({ error: "Email already exists" }, { status: 409 });
      const { salt, hash } = makePassword(password);
      const id = randomUUID();
      const rows = await db.sql`
        INSERT INTO app_users (id, email, full_name, password_salt, password_hash, role, active, created_at, updated_at)
        VALUES (${id}, ${email}, ${name}, ${salt}, ${hash}, ${role}, TRUE, NOW(), NOW())
        RETURNING id, email, full_name, role, active, created_at, updated_at, last_login_at
      `;
      return Response.json({ ok: true, user: publicUser(rows[0]) }, { status: 201 });
    }

    if (action === "update") {
      const id = String(body?.id ?? "");
      const name = String(body?.name ?? "").trim();
      const email = normalizeEmail(body?.email);
      const role = String(body?.role ?? "seller");
      const active = body?.active !== false;
      if (!id || name.length < 2 || !email.includes("@") || !VALID_ROLES.has(role)) return Response.json({ error: "Invalid user data" }, { status: 400 });

      const targetRows = await db.sql`SELECT id, role, active FROM app_users WHERE id = ${id} LIMIT 1`;
      const target: any = targetRows[0];
      if (!target) return Response.json({ error: "User not found" }, { status: 404 });
      if (id === current.id && (role !== "admin" || !active)) return Response.json({ error: "Cannot remove your own admin access" }, { status: 400 });

      const duplicate = await db.sql`SELECT id FROM app_users WHERE email = ${email} AND id <> ${id} LIMIT 1`;
      if (duplicate[0]) return Response.json({ error: "Email already exists" }, { status: 409 });

      if (target.role === "admin" && target.active && (role !== "admin" || !active)) {
        const admins = await db.sql`SELECT COUNT(*)::int AS count FROM app_users WHERE role = 'admin' AND active = TRUE`;
        if (Number((admins[0] as any)?.count ?? 0) <= 1) return Response.json({ error: "At least one active admin is required" }, { status: 400 });
      }

      const rows = await db.sql`
        UPDATE app_users
        SET full_name = ${name}, email = ${email}, role = ${role}, active = ${active}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, email, full_name, role, active, created_at, updated_at, last_login_at
      `;
      if (id !== current.id) await db.sql`DELETE FROM auth_sessions WHERE user_id = ${id}`;
      return Response.json({ ok: true, user: publicUser(rows[0]) });
    }

    if (action === "reset-password") {
      const id = String(body?.id ?? "");
      const password = String(body?.password ?? "");
      if (!id || password.length < 8) return Response.json({ error: "Invalid password" }, { status: 400 });
      if (id === current.id) return Response.json({ error: "Use change-password for your own account" }, { status: 400 });
      const exists = await db.sql`SELECT id FROM app_users WHERE id = ${id} LIMIT 1`;
      if (!exists[0]) return Response.json({ error: "User not found" }, { status: 404 });
      const { salt, hash } = makePassword(password);
      await db.sql`UPDATE app_users SET password_salt = ${salt}, password_hash = ${hash}, updated_at = NOW() WHERE id = ${id}`;
      await db.sql`DELETE FROM auth_sessions WHERE user_id = ${id}`;
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "User management operation failed" }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/users",
};
