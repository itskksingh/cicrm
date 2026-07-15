import assert from "node:assert/strict";
import test from "node:test";
import {
  CUSTOMER_SERVICE_WINDOW_MS,
  evaluateChannelPolicy,
  evaluateMedicalSafety,
} from "../lib/messaging/policy";

const now = new Date("2026-07-15T12:00:00.000Z");

test("allows a service reply inside a patient-opened 24-hour window", () => {
  const result = evaluateChannelPolicy({
    origin: "REACTIVE_AUTOMATION",
    lastPatientMessageAt: new Date(now.getTime() - 60_000),
    now,
  });

  assert.equal(result.allowed, true);
  if (result.allowed) {
    assert.equal(result.consentBasis, "PATIENT_INITIATED_SERVICE_WINDOW");
  }
});

test("blocks a free-form message when the service window is closed", () => {
  const result = evaluateChannelPolicy({
    origin: "STAFF_REPLY",
    lastPatientMessageAt: new Date(now.getTime() - CUSTOMER_SERVICE_WINDOW_MS),
    now,
  });

  assert.deepEqual(result, {
    allowed: false,
    reason: "SERVICE_WINDOW_CLOSED",
    serviceWindowOpen: false,
  });
});

test("blocks sending when no patient message establishes consent", () => {
  const result = evaluateChannelPolicy({
    origin: "SCHEDULED_FOLLOW_UP",
    lastPatientMessageAt: null,
    now,
  });

  assert.equal(result.allowed, false);
});

test("replaces emergency drafts and requires an urgent handoff", () => {
  const result = evaluateMedicalSafety({
    intent: "EMERGENCY",
    riskScore: 95,
    draftReply: "You are fine. Wait until tomorrow.",
    sanitizerTriggered: false,
  });

  assert.equal(result.action, "ESCALATE");
  assert.equal(result.reason, "EMERGENCY_INTENT");
  assert.equal(result.priority, "HOT");
  assert.doesNotMatch(result.finalReply ?? "", /you are fine/i);
});

test("blocks unsafe AI medical advice and escalates it", () => {
  const result = evaluateMedicalSafety({
    intent: "SAFE",
    riskScore: 10,
    draftReply: "You should take this tablet twice daily.",
    sanitizerTriggered: true,
  });

  assert.equal(result.action, "ESCALATE");
  assert.equal(result.reason, "UNSAFE_AI_OUTPUT_BLOCKED");
  assert.doesNotMatch(result.finalReply ?? "", /twice daily/i);
});

test("preserves a valid administrative hospital reply", () => {
  const draftReply = "The hospital is open from 9 AM to 6 PM.";
  const result = evaluateMedicalSafety({
    intent: "INFO",
    riskScore: 30,
    draftReply,
    sanitizerTriggered: false,
  });

  assert.equal(result.action, "SEND");
  assert.equal(result.finalReply, draftReply);
});
