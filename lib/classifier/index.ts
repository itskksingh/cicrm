export type IntentType = "SAFE" | "INFO" | "RISKY" | "DANGEROUS" | "EMERGENCY";

export function classifyIntent(message: string): IntentType {
  const lowerMsg = message.toLowerCase();

  // EMERGENCY: chest pain, accident, unconscious, severe bleeding
  if (
    lowerMsg.match(/\b(chest pain|accident|unconscious|severe bleeding|heart attack|stroke|saans|chest|chot|emergency|urgent)\b/i)
  ) {
    return "EMERGENCY";
  }

  // DANGEROUS: medicine, treatment, diagnosis queries
  if (
    lowerMsg.match(/\b(medicine|treatment|cure|diagnosis|dawa|dawae|tablet|syrup|capsule|injection|prescribe|disease|bimari ke liye|konsi dawa)\b/i)
  ) {
    return "DANGEROUS";
  }

  // RISKY: symptoms (pain, fever, swelling, etc.)
  if (
    lowerMsg.match(/\b(symptoms|pain|fever|swelling|dard|bukhar|sujan|khasi|cough|cold|headache|stomach pain|vomiting)\b/i)
  ) {
    return "RISKY";
  }

  // INFO: doctor availability, services
  if (
    lowerMsg.match(/\b(doctor|availability|services|timing|fee|charge|cost|kab milenge|kaun se doctor)\b/i)
  ) {
    return "INFO";
  }

  // SAFE: appointment, timing, location, hospital info
  return "SAFE";
}
