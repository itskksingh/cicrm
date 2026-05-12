import { IntentType } from "../classifier";
import { SAFE_REDIRECT_MESSAGE, DOCTOR_REDIRECT_MESSAGE, EMERGENCY_MESSAGE } from "../compliance/constants";

export function evaluatePolicy(intent: IntentType): string | null {
  if (intent === "DANGEROUS") {
    return SAFE_REDIRECT_MESSAGE;
  }

  if (intent === "RISKY") {
    return DOCTOR_REDIRECT_MESSAGE;
  }

  if (intent === "EMERGENCY") {
    return EMERGENCY_MESSAGE;
  }

  // If intent is SAFE or INFO, return null allowing the AI to respond
  return null;
}
