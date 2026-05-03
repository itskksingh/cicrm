import { prisma } from '@/lib/prisma'

let defaultOrgId: string | null = null

export async function getDefaultOrganizationId(): Promise<string> {
  if (defaultOrgId) return defaultOrgId

  let org = await prisma.organization.findFirst({
    where: { name: 'Crest Care Hospital' }
  })

  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Crest Care Hospital' }
    })
  }

  defaultOrgId = org.id
  return defaultOrgId
}
