import { prisma } from "../lib/prisma";

async function main() {
  console.log('Starting data migration...')

  // 1. Create a default organization
  let org = await prisma.organization.findFirst({
    where: { name: 'Crest Care Hospital' }
  })

  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Crest Care Hospital' }
    })
    console.log('Created default organization:', org.name)
  } else {
    console.log('Default organization already exists:', org.name)
  }

  // 2. Attach all existing data
  const orgId = org.id

  const leadsRes = await prisma.lead.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId }
  })
  console.log(`Updated ${leadsRes.count} leads.`)

  const staffRes = await prisma.staff.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId }
  })
  console.log(`Updated ${staffRes.count} staff members.`)

  const messagesRes = await prisma.message.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId }
  })
  console.log(`Updated ${messagesRes.count} messages.`)

  const callLogsRes = await prisma.callLog.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId }
  })
  console.log(`Updated ${callLogsRes.count} call logs.`)

  const chunksRes = await prisma.knowledgeChunk.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId }
  })
  console.log(`Updated ${chunksRes.count} knowledge chunks.`)

  console.log('Data migration complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
