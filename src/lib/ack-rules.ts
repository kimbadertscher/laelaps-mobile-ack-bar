import type { AckEvent, Outcome } from "@/data/types";

/** "Keep observing" is a camera-only, non-final marker. Access events never offer it. */
export const canKeepObserving = (event: AckEvent) => event.product === "camera_vlm";

export const isObserved = (event: AckEvent) => event.ackObservingAt !== null;

export const isAcknowledged = (event: AckEvent) => event.acknowledgedAt !== null;

/** An outcome must be chosen, and outcomes with requiresNote need a non-blank note. */
export const canConfirm = (outcome: Outcome | null, note: string) =>
  outcome !== null && (!outcome.requiresNote || note.trim().length > 0);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
