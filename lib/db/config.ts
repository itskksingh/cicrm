import { prisma } from '@/lib/prisma'
import { getDefaultOrganizationId } from './organization'

// Hardcoded fallback data
const FALLBACK_DOCTORS = [
  { name: 'Dr. Sharma', department: 'Gastroenterology' },
  { name: 'Dr. Patel', department: 'Pediatrics' },
  { name: 'Dr. Singh', department: 'Orthopedics' },
  { name: 'Dr. Gupta', department: 'General Medicine' }
]

const FALLBACK_SETTINGS = {
  'hospital_name': 'Crest Care Hospital',
  'whatsapp_fallback_message': 'हमारी टीम आपसे जल्द संपर्क करेगी'
}

export async function getDoctors(organizationId?: string) {
  const orgId = organizationId || await getDefaultOrganizationId()
  const doctors = await prisma.doctor.findMany({
    where: { organizationId: orgId }
  })
  
  if (doctors.length === 0) {
    return FALLBACK_DOCTORS
  }
  
  return doctors
}

export async function getSetting(key: string, organizationId?: string): Promise<string> {
  const orgId = organizationId || await getDefaultOrganizationId()
  const setting = await prisma.settings.findUnique({
    where: {
      organizationId_key: {
        organizationId: orgId,
        key
      }
    }
  })
  
  if (setting) {
    return setting.value
  }
  
  return FALLBACK_SETTINGS[key as keyof typeof FALLBACK_SETTINGS] || ''
}
