import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CreateStaffInput = {
  name: string;
  phone: string;
  email?: string;
  role?: Role;
  department: string;
  organizationId?: string;
};

import { getDefaultOrganizationId } from "./organization";

// ─── Query Functions ──────────────────────────────────────────────────────────

/**
 * Finds a staff member by email — used during the login flow
 * to verify credentials before creating a session.
 */
export async function getStaffByEmail(email: string) {
  return prisma.staff.findUnique({
    where: { email },
  });
}

/**
 * Finds a staff member by phone — alternative login identifier.
 */
export async function getStaffByPhone(phone: string) {
  return prisma.staff.findUnique({
    where: { phone },
  });
}

/**
 * Returns all staff members — used by the Admin panel for
 * staff management and lead assignment dropdowns.
 */
export async function getAllStaff(organizationId?: string) {
  const orgId = organizationId || await getDefaultOrganizationId();
  return prisma.staff.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      department: true,
      createdAt: true,
      _count: {
        select: { leads: true, callLogs: true },
      },
    },
  });
}

/**
 * Creates a new staff member — called from the Admin panel.
 * NOTE: In production, pair this with Supabase Auth user creation.
 */
export async function createStaff(data: CreateStaffInput) {
  return prisma.staff.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      role: data.role ?? Role.CALLER,
      department: data.department,
      organizationId: data.organizationId || await getDefaultOrganizationId(),
    },
  });
}

/**
 * Returns all callers (non-admin staff) available for lead assignment.
 */
export async function getAvailableCallers(organizationId?: string) {
  const orgId = organizationId || await getDefaultOrganizationId();
  return prisma.staff.findMany({
    where: { role: Role.CALLER, organizationId: orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, department: true, phone: true },
  });
}
