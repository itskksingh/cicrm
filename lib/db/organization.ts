import { prisma } from '@/lib/prisma'

let defaultOrgId: string | null = null

export async function getDefaultOrganizationId(): Promise<string | null> {
  if (defaultOrgId) return defaultOrgId

  const org = await prisma.organization.findFirst({
    where: { name: 'Crest Care Hospital' }
  })

  if (!org) {
    return null
  }

  defaultOrgId = org.id
  return defaultOrgId
}
