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
    const mapping = await prisma.whatsappNumber.findUnique({
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
