import { prisma } from '../lib/prisma';
import { getDefaultOrganizationId } from '../lib/db/organization';
import { encrypt } from '../lib/encryption';

async function main() {
  // We use the existing environment variables for the initial seed
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error("Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID in environment variables.");
    process.exit(1);
  }

  // Get the default organization (Crest Care Hospital)
  const organizationId = await getDefaultOrganizationId();

  const encryptedToken = encrypt(token);

  // Upsert ensures no duplicates and safe re-runs
  await prisma.whatsAppCredential.upsert({
    where: { organizationId },
    update: {
      accessToken: encryptedToken,
      phoneNumberId: phoneNumberId,
    },
    create: {
      organizationId,
      accessToken: encryptedToken,
      phoneNumberId: phoneNumberId,
    },
  });

  console.log(`[Success] Seeded WhatsApp credentials for organization ID: ${organizationId}`);
  console.log(`[Success] Phone Number ID configured: ${phoneNumberId}`);
  console.log(`[Security] Token safely stored in DB without logging.`);
}

main()
  .catch((e) => {
    console.error("[Error] Failed to seed WhatsApp credentials:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
