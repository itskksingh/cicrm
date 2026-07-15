import { prisma } from '@/lib/prisma'

/**
 * Maps a WhatsApp phone number to its corresponding organization.
 * Used for multi-tenant webhook routing.
 * 
 * @param phoneNumber The normalized E.164 phone number (e.g., +919876543210)
 * @returns The organization and its ID, or null if not found
 */
export async function getOrganizationByWhatsAppNumber(phoneNumber: string) {
  try {
    const mapping = await prisma.whatsAppNumber.findUnique({
      where: {
        phoneNumber: phoneNumber,
      },
      include: {
        organization: true,
      },
    })

    if (!mapping) {
      return null
    }

    return {
      organizationId: mapping.organizationId,
      organization: mapping.organization,
    }
  } catch (error) {
    console.error('Error fetching organization by WhatsApp number:', error)
    return null
  }
}

export async function getOrganizationByPhoneNumberId(phoneNumberId: string) {
  try {
    const credential = await prisma.whatsAppCredential.findFirst({
      where: { phoneNumberId },
      select: {
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            disabled: true,
            onboardingComplete: true,
          },
        },
      },
    });

    if (!credential || credential.organization.disabled) return null;

    return {
      organizationId: credential.organizationId,
      organization: credential.organization,
    };
  } catch (error) {
    console.error("Error fetching organization by WhatsApp phone number ID:", error);
    return null;
  }
}
