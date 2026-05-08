export function getRiskScore(message: string): number {
  const lowerMsg = message.toLowerCase();

  let score = 0;

  // EMERGENCY keywords (90-100)
  if (lowerMsg.match(/\b(chest pain|accident|unconscious|severe bleeding|heart attack|stroke|emergency|urgent)\b/i)) {
    score += 95;
  }

  // DANGEROUS keywords (70-90)
  if (lowerMsg.match(/\b(medicine|treatment|cure|diagnosis|dawa|tablet|injection|prescribe)\b/i)) {
    score += 80;
  }

  // RISKY keywords (40-70)
  if (lowerMsg.match(/\b(symptoms|pain|fever|swelling|dard|bukhar|sujan|khasi)\b/i)) {
    score += 55;
  }

  // INFO keywords (20-40)
  if (lowerMsg.match(/\b(doctor|availability|services)\b/i)) {
    score += 30;
  }

  // SAFE: (0-20)
  if (score === 0) {
    score = 10;
  }

  return Math.min(score, 100);
}
