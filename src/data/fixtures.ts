import type { AckEvent, Person } from "./types";

export const currentUser: Person = { id: "u-kim", name: "Kim B." };

const minutesAgo = (now: Date, minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

const base = {
  ackObservingAt: null,
  ackObservingBy: null,
  acknowledgedAt: null,
  acknowledgedBy: null,
  acknowledgedOutcomeId: null,
  acknowledgedNote: null,
} satisfies Partial<AckEvent>;

/** The three fixtures the prototype must handle. Times are relative to `now` so the demo always reads "2 min ago". */
export const createFixtures = (now: Date = new Date()) => ({
  // 1. Camera, high severity, nobody observing yet.
  cameraHigh: {
    ...base,
    id: "evt-cam-high",
    product: "camera_vlm",
    severity: "high",
    title: "Person at the pump station control panel",
    summary:
      "A person is crouching at the control panel, partially hidden behind the pump housing for 12 seconds. Consistent with possible tampering.",
    site: "Pump Station",
    zone: "North fence",
    source: "CAM 04",
    sourceDetail: "Perimeter east",
    occurredAt: minutesAgo(now, 2),
    detection: { label: "person", confidence: 0.92 },
    outcomes: [
      { id: "confirmed_intrusion", label: "Confirmed intrusion", requiresNote: true },
      { id: "false_alarm", label: "False alarm", requiresNote: false },
      { id: "authorized_person", label: "Authorized person", requiresNote: false },
      { id: "needs_follow_up", label: "Needs follow-up", requiresNote: true },
    ],
  },
  // 2. Access control, medium severity. Never offers "Keep observing".
  accessMedium: {
    ...base,
    id: "evt-access-medium",
    product: "access_control",
    severity: "medium",
    title: "Door held open · Server room B",
    summary: "Door B2 has been open for 90 seconds after a valid badge entry by M. Keller. No second badge read.",
    site: "Building 3",
    zone: "Level 1",
    source: "Reader B2",
    sourceDetail: "Server room",
    occurredAt: minutesAgo(now, 6),
    detection: null,
    outcomes: [
      { id: "authorized_door_closed", label: "Authorized, door closed", requiresNote: false },
      { id: "unauthorized_entry", label: "Unauthorized entry", requiresNote: true },
      { id: "reader_fault", label: "Reader fault", requiresNote: false },
    ],
  },
  // 3. Camera, low severity, already being observed by a colleague. Can still be acknowledged.
  cameraLowObserved: {
    ...base,
    id: "evt-cam-low",
    product: "camera_vlm",
    severity: "low",
    title: "Vehicle parked in restricted lane",
    summary: "A delivery van has been stationary in the fire lane next to Hall 2 for 8 minutes. No person visible.",
    site: "Hall 2",
    zone: "Fire lane",
    source: "CAM 11",
    sourceDetail: "Yard south",
    occurredAt: minutesAgo(now, 23),
    detection: { label: "vehicle", confidence: 0.88 },
    outcomes: [
      { id: "known_delivery", label: "Known delivery", requiresNote: false },
      { id: "report_to_site", label: "Report to site", requiresNote: false },
      { id: "needs_follow_up", label: "Needs follow-up", requiresNote: true },
    ],
    ackObservingAt: minutesAgo(now, 4),
    ackObservingBy: { id: "u-lars", name: "Lars R." },
  },
}) satisfies Record<string, AckEvent>;

export type Fixtures = ReturnType<typeof createFixtures>;
export type FixtureKey = keyof Fixtures;
export const fixtureKeys = ["cameraHigh", "accessMedium", "cameraLowObserved"] as const satisfies readonly FixtureKey[];
