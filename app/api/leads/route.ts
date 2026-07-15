import { NextResponse } from "next/server";
import { getLeadsByPriority } from "@/lib/db/leads";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    // Attempt to resolve organizationId from the logged-in session.
    const session = await getServerSession(authOptions);
    const organizationId = session?.user?.organizationId;
    if (!session?.user || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leads = await getLeadsByPriority(organizationId);
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
