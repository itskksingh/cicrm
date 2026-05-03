import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// ─── Role Constants ────────────────────────────────────────────────────────────

export const ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

// ─── Route-level Guard (for API routes) ───────────────────────────────────────

/**
 * Call this at the top of any Server-Side API route handler.
 * Returns { session, organizationId } if the user passes the role check.
 * Returns a NextResponse 401/403 that you should immediately return if access is denied.
 *
 * @example
 * const result = await requireRole([ROLES.ADMIN]);
 * if (result instanceof NextResponse) return result;
 * const { session, organizationId } = result;
 */
export async function requireRole(allowedRoles: AppRole[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role as AppRole;
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient permissions" },
      { status: 403 }
    );
  }

  return {
    session,
    organizationId: session.user.organizationId,
    role: userRole,
  };
}

// ─── Page-level Guard (for Server Components) ─────────────────────────────────

/**
 * Call this inside a server component (page.tsx).
 * Returns the session if the user has an allowed role.
 * Returns null if denied — caller should redirect or render 403 UI.
 *
 * @example
 * const session = await getSessionWithRole([ROLES.ADMIN]);
 * if (!session) redirect('/dashboard');
 */
export async function getSessionWithRole(allowedRoles: AppRole[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) return null;

  const userRole = session.user.role as AppRole;
  if (!allowedRoles.includes(userRole)) return null;

  return session;
}
