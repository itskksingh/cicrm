import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

// ---------------------------------------------------------------------------
// Audit Logger
// ---------------------------------------------------------------------------
type CredentialAction = "CREDENTIAL_CREATED" | "CREDENTIAL_UPDATED" | "CREDENTIAL_DELETED";

interface AuditEvent {
  action: CredentialAction;
  organizationId: string;
  phoneNumberId?: string;   // included where relevant, never the token
  timestamp: string;
}

function logCredentialEvent(event: AuditEvent): void {
  // Structured log — safe to stream to any log aggregator later (Datadog, Loki, etc.)
  // Token fields are intentionally absent from the AuditEvent type.
  console.log(
    `[AUDIT] ${event.timestamp} | action=${event.action} | orgId=${event.organizationId}` +
    (event.phoneNumberId ? ` | phoneNumberId=${event.phoneNumberId}` : "")
  );
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

export async function getMaskedCredentials(organizationId: string) {
  if (!organizationId) {
    throw new Error("organizationId is required");
  }

  const creds = await prisma.whatsAppCredential.findUnique({
    where: { organizationId },
  });

  if (!creds) {
    return null;
  }

  return {
    phoneNumberId: creds.phoneNumberId,
    lastSuccessAt: creds.lastSuccessAt,
    lastFailureAt: creds.lastFailureAt,
    failureCount: creds.failureCount,
    createdAt: creds.createdAt,
    updatedAt: creds.updatedAt,
    hasAccessToken: !!creds.accessToken,
  };
}

export async function upsertCredentials(
  organizationId: string,
  phoneNumberId: string,
  accessToken: string
) {
  if (!organizationId) throw new Error("organizationId is required");
  if (!phoneNumberId || typeof phoneNumberId !== "string" || phoneNumberId.trim() === "") {
    throw new Error("Invalid or missing phoneNumberId");
  }
  if (!accessToken || typeof accessToken !== "string" || accessToken.trim() === "") {
    throw new Error("Invalid or missing accessToken");
  }

  const cleanPhoneNumberId = phoneNumberId.trim();
  const encryptedToken = encrypt(accessToken.trim());

  // Determine whether this is a create or update for the audit log
  const existing = await prisma.whatsAppCredential.findUnique({
    where: { organizationId },
    select: { id: true },
  });

  const creds = await prisma.whatsAppCredential.upsert({
    where: { organizationId },
    update: {
      phoneNumberId: cleanPhoneNumberId,
      accessToken: encryptedToken,
    },
    create: {
      organizationId,
      phoneNumberId: cleanPhoneNumberId,
      accessToken: encryptedToken,
    },
  });

  logCredentialEvent({
    action: existing ? "CREDENTIAL_UPDATED" : "CREDENTIAL_CREATED",
    organizationId,
    phoneNumberId: cleanPhoneNumberId,
    timestamp: new Date().toISOString(),
  });

  return {
    phoneNumberId: creds.phoneNumberId,
    hasAccessToken: true,
  };
}

export async function deleteCredentials(organizationId: string) {
  if (!organizationId) throw new Error("organizationId is required");

  try {
    await prisma.whatsAppCredential.delete({
      where: { organizationId },
    });

    logCredentialEvent({
      action: "CREDENTIAL_DELETED",
      organizationId,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      // Record not found — nothing to log
      return false;
    }
    throw error;
  }
}
