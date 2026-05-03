import { prisma } from "../prisma";
import { decrypt } from "../encryption";

/**
 * Fetches the WhatsApp API credentials for a specific organization.
 * Safely handles missing credentials by returning null.
 */
export async function getWhatsAppCredentials(organizationId: string) {
  try {
    if (!organizationId) return null;

    const credentials = await prisma.whatsAppCredential.findUnique({
      where: { organizationId },
      select: {
        phoneNumberId: true,
        accessToken: true,
      },
    });

    if (credentials?.accessToken) {
      credentials.accessToken = decrypt(credentials.accessToken);
    }

    return credentials;
  } catch (error) {
    console.error(`[DB Error] Failed to fetch WhatsApp credentials for org ${organizationId}:`, error);
    return null;
  }
}

/**
 * Updates the health monitoring fields of a credential based on API success or failure.
 */
export async function updateCredentialHealth(organizationId: string, success: boolean) {
  try {
    if (!organizationId) return;
    
    if (success) {
      await prisma.whatsAppCredential.update({
        where: { organizationId },
        data: {
          lastSuccessAt: new Date(),
          failureCount: 0,
        }
      });
    } else {
      await prisma.whatsAppCredential.update({
        where: { organizationId },
        data: {
          lastFailureAt: new Date(),
          failureCount: { increment: 1 }
        }
      });
    }
  } catch (error) {
    console.error(`[DB Error] Failed to update credential health for org ${organizationId}:`, error);
  }
}

/**
 * Validates that an organization has active WhatsApp credentials.
 * Logs a warning and returns false if they rely on the environment fallback.
 */
export async function validateOrganizationCredentials(organizationId: string): Promise<boolean> {
  if (!organizationId) return false;

  const credentials = await getWhatsAppCredentials(organizationId);
  if (!credentials || !credentials.accessToken || !credentials.phoneNumberId) {
    console.warn(`[Integrity Warning] Organization ${organizationId} lacks dedicated WhatsApp credentials. Falling back to temporary environment variables.`);
    return false;
  }
  return true;
}
