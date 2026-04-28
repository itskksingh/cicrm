"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * Creates the internal Prisma Staff record after successful Supabase Auth signup.
 * Binds the Supabase User UID to the Prisma Staff ID.
 */
export async function syncStaffRecord(
  id: string,
  email: string,
  name: string,
  phone: string,
  department: string
) {
  try {
    const staff = await prisma.staff.create({
      data: {
        id, // Match Supabase User ID
        email,
        name,
        phone,
        department,
        role: Role.CALLER, // Default role
      },
      select: {
        id: true,
        email: true,
        role: true,
        department: true,
      },
    });
    
    return { success: true, staff };
  } catch (error: any) {
    console.error("Error creating staff record:", error);
    return { success: false, error: "Failed to create internal staff record. Phone number might already be restricted." };
  }
}

/**
 * Fetches the Prisma Staff profile associated with a Supabase auth user
 */
export async function getStaffProfile(id: string) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    if (!staff) {
      return { success: false, error: "Staff record not found for this user." };
    }

    return { success: true, staff };
  } catch (error: any) {
    console.error("Error fetching staff record:", error);
    return { success: false, error: "Database exception while fetching staff record." };
  }
}
