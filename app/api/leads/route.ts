import { NextResponse } from "next/server";
import { getLeadsByPriority } from "@/lib/db/leads";

export async function GET() {
  try {
    const leads = await getLeadsByPriority();
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
