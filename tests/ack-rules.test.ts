import { describe, expect, it } from "vitest";
import { createFixtures } from "@/data/fixtures";
import { canConfirm, canKeepObserving, formatDuration, initials, isObserved } from "@/lib/ack-rules";

const fixtures = createFixtures(new Date("2026-10-19T01:04:00Z"));

describe("ack rules", () => {
  it("needs an outcome before confirming", () => {
    expect(canConfirm(null, "anything")).toBe(false);
  });

  it("blocks requiresNote outcomes until a non-blank note exists", () => {
    const intrusion = fixtures.cameraHigh.outcomes.find((o) => o.id === "confirmed_intrusion")!;
    expect(intrusion.requiresNote).toBe(true);
    expect(canConfirm(intrusion, "")).toBe(false);
    expect(canConfirm(intrusion, "   \n ")).toBe(false);
    expect(canConfirm(intrusion, "Person at the panel")).toBe(true);
  });

  it("lets outcomes without requiresNote confirm with an empty note", () => {
    const falseAlarm = fixtures.cameraHigh.outcomes.find((o) => o.id === "false_alarm")!;
    expect(canConfirm(falseAlarm, "")).toBe(true);
  });

  it("offers keep observing only for camera_vlm", () => {
    expect(canKeepObserving(fixtures.cameraHigh)).toBe(true);
    expect(canKeepObserving(fixtures.cameraLowObserved)).toBe(true);
    expect(canKeepObserving(fixtures.accessMedium)).toBe(false);
  });

  it("treats ackObservingAt as the observing marker", () => {
    expect(isObserved(fixtures.cameraLowObserved)).toBe(true);
    expect(isObserved(fixtures.cameraHigh)).toBe(false);
  });

  it("formats helpers", () => {
    expect(formatDuration(7)).toBe("0:07");
    expect(formatDuration(65)).toBe("1:05");
    expect(initials("Lars R.")).toBe("LR");
  });
});
