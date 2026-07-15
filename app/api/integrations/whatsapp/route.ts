import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getMaskedCredentials,
  upsertCredentials,
  deleteCredentials,
} from "@/lib/services/whatsapp-credentials";

// Common Auth + RBAC Check
async function authenticateAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  // Ensure role is admin
  if (session.user.role?.toLowerCase() !== "admin") {
    return { error: "Forbidden: Admin access required", status: 403 };
  }

  if (!session.user.organizationId) {
    return { error: "Organization not found in session", status: 400 };
  }

  return { organizationId: session.user.organizationId };
}

// GET Handler
export async function GET() {
  const auth = await authenticateAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const creds = await getMaskedCredentials(auth.organizationId!);

    if (!creds) {
      return NextResponse.json(
        { message: "No credentials found" },
        { status: 404 }
      );
    }

    return NextResponse.json(creds);
  } catch (error) {
    console.error("Error fetching whatsapp credentials:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return handleUpsert(req);
}

export async function PATCH(req: Request) {
  return handleUpsert(req);
}

// POST/PATCH UPSERT Logic
async function handleUpsert(req: Request) {
  const auth = await authenticateAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { phoneNumberId, accessToken } = body;

    const result = await upsertCredentials(
      auth.organizationId!,
      phoneNumberId,
      accessToken
    );

    return NextResponse.json({
      message: "Credentials saved successfully",
      phoneNumberId: result.phoneNumberId,
      hasAccessToken: result.hasAccessToken,
    });
  } catch (error) {
    console.error("Error saving whatsapp credentials:", error);
    // Handle validation errors from service
    if (error && typeof error === "object" && "message" in error && typeof (error as any).message === "string" && (error as any).message.includes("Invalid")) {
      return NextResponse.json({ error: (error as any).message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE Handler
export async function DELETE() {
  const auth = await authenticateAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const deleted = await deleteCredentials(auth.organizationId!);

    if (!deleted) {
      return NextResponse.json(
        { message: "No credentials found to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Credentials deleted successfully" });
  } catch (error) {
    console.error("Error deleting whatsapp credentials:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
