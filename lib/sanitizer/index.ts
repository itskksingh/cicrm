import { SAFE_REDIRECT_MESSAGE } from "../compliance/constants";

export function sanitizeResponse(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // Block phrases
  const blockedPhrases = [
    "you have",
    "it is likely",
    "you should take",
    "medicine",
    "treatment",
    "diagnosis",
    "dawa",
    "tablet",
    "bimari hai",
    "lagta hai aapko"
  ];

  for (const phrase of blockedPhrases) {
    if (lowerText.includes(phrase)) {
      return SAFE_REDIRECT_MESSAGE;
    }
  }

  // If safe, return null
  return null;
}
