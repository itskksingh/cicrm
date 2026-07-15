import type { IntentType } from "@/lib/classifier";
import {
  DOCTOR_REDIRECT_MESSAGE,
  EMERGENCY_MESSAGE,
  SAFE_REDIRECT_MESSAGE,
} from "@/lib/compliance/constants";

export const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type MessageOrigin =
  | "REACTIVE_AUTOMATION"
  | "STAFF_REPLY"
  | "SCHEDULED_FOLLOW_UP";

export type ChannelPolicyDecision =
  | {
      allowed: true;
      consentBasis: "PATIENT_INITIATED_SERVICE_WINDOW";
      serviceWindowOpen: true;
    }
  | {
      allowed: false;
      reason:
        | "NO_PATIENT_MESSAGE"
        | "SERVICE_WINDOW_CLOSED"
        | "PATIENT_MESSAGE_IN_FUTURE";
      serviceWindowOpen: false;
    };

export function evaluateChannelPolicy(input: {
  origin: MessageOrigin;
  lastPatientMessageAt: Date | null;
  now?: Date;
}): ChannelPolicyDecision {
  const now = input.now ?? new Date();
  const lastPatientMessageAt = input.lastPatientMessageAt;

  if (!lastPatientMessageAt) {
    return {
      allowed: false,
      reason: "NO_PATIENT_MESSAGE",
      serviceWindowOpen: false,
    };
  }

  const elapsed = now.getTime() - lastPatientMessageAt.getTime();
  if (elapsed < 0) {
    return {
      allowed: false,
      reason: "PATIENT_MESSAGE_IN_FUTURE",
      serviceWindowOpen: false,
    };
  }

  if (elapsed >= CUSTOMER_SERVICE_WINDOW_MS) {
    return {
      allowed: false,
      reason: "SERVICE_WINDOW_CLOSED",
      serviceWindowOpen: false,
    };
  }

  return {
    allowed: true,
    consentBasis: "PATIENT_INITIATED_SERVICE_WINDOW",
    serviceWindowOpen: true,
  };
}

export type MedicalSafetyDecision = {
  action: "SEND" | "ESCALATE" | "REFUSE";
  finalReply: string | null;
  reason: string;
  priority: "HOT" | "WARM" | null;
};

export function evaluateMedicalSafety(input: {
  intent: IntentType;
  riskScore: number;
  draftReply: string;
  sanitizerTriggered: boolean;
}): MedicalSafetyDecision {
  if (input.intent === "EMERGENCY") {
    return {
      action: "ESCALATE",
      finalReply: EMERGENCY_MESSAGE,
      reason: "EMERGENCY_INTENT",
      priority: "HOT",
    };
  }

  if (input.intent === "DANGEROUS") {
    return {
      action: "ESCALATE",
      finalReply: SAFE_REDIRECT_MESSAGE,
      reason: "MEDICAL_ADVICE_REQUEST",
      priority: "HOT",
    };
  }

  if (input.intent === "RISKY" || input.riskScore > 70) {
    return {
      action: "ESCALATE",
      finalReply: DOCTOR_REDIRECT_MESSAGE,
      reason: "CLINICAL_REVIEW_REQUIRED",
      priority: input.riskScore > 90 ? "HOT" : "WARM",
    };
  }

  if (input.sanitizerTriggered) {
    return {
      action: "ESCALATE",
      finalReply: SAFE_REDIRECT_MESSAGE,
      reason: "UNSAFE_AI_OUTPUT_BLOCKED",
      priority: "WARM",
    };
  }

  const draftReply = input.draftReply.trim();
  if (!draftReply || draftReply.length > 4096) {
    return {
      action: "REFUSE",
      finalReply: null,
      reason: "INVALID_AI_DRAFT",
      priority: "WARM",
    };
  }

  return {
    action: "SEND",
    finalReply: draftReply,
    reason: "SAFE_SERVICE_RESPONSE",
    priority: null,
  };
}
