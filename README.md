# MobileAckBar · Laelaps prototype

It is 03:00. An operator on night shift gets a push notification, taps it and lands on the event page. They need to understand what happened and acknowledge it, one-handed, possibly in the dark, possibly while walking.

On desktop this is done by `AckFooter` on feed cards. It only appears on hover or keyboard focus, so it does not work on a phone. `MobileAckBar` is the phone version: an always-visible bar at the bottom of a 390px screen and a bottom sheet to pick the outcome.

**Live prototype:** https://kimbadertscher.github.io/laelaps-mobile-ack-bar/
**Figma (variant A, dark flow):** https://www.figma.com/design/nR1pIuqbgWhxllQ6IdWIFm/Mobile-Acknowledge?node-id=4-92

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # rules from the brief
npm run typecheck
npm run build      # static export to out/
```

On a desktop browser the prototype shows a 390 × 844 phone frame with a control panel (fixture, screen, theme, language). On a phone it fills the screen; the same controls open from the `⋯` button in the event header.

## Rules from the brief and where they are tested

| Rule | Code | Test |
|---|---|---|
| Outcomes come from `event.outcomes`; pick one, then confirm | `AckSheet`, `OutcomeRow` | `lists exactly the outcomes from fixture.outcomes`, `keeps confirm disabled until an outcome is picked` |
| `requiresNote: true` cannot be submitted until a note is written | `canConfirm` in `lib/ack-rules.ts` | `blocks a requiresNote outcome until a note is written, whitespace does not count` |
| `product: "camera_vlm"` also offers "Keep observing", a non-final "I am watching" marker | `canKeepObserving` | `is offered for camera_vlm and marks observing` |
| `product: "access_control"` never offers it | `canKeepObserving` | `is never offered for access_control` |
| An event being observed (`ackObservingAt` set) shows who and since when, and can still be acknowledged | `ObservingBanner`, `MobileAckBar` | `shows who is observing and since when`, `can still be acknowledged` |
| Every user-visible string goes through `t()` from next-intl, keys in both locales | `src/messages/en.json`, `de.json` | `has the same keys in en and de`; every render test throws on a missing key, in both `en` and `de` |
| Renders and behaves for all three fixtures | `src/data/fixtures.ts` | `renders <fixture> in <locale> without missing messages` |

## Components and their Figma layers

| Component | Figma layer |
|---|---|
| `MobileAckBar` | `MobileAckBar` (severity rail, Keep observing, Acknowledge) |
| `AckSheet` | `Ack sheet` |
| `OutcomeRow` | `Outcome row` |
| `NoteField` | `Note field/empty`, `Note field/recording`, `Note field/transcribed` |
| `ObservingBanner` | `Observing banner` |
| `CameraFrame` | `Camera frame` |
| `SeverityBadge` | `Badge/high`, `Badge/medium`, `Badge/low` |
| `EventMeta` | `Meta` |
| `Button` | `Button/primary`, `Button/secondary`, `Button/ghost` |
| `EventPage` | `01 Event · camera high` and siblings |
| `PushNotification` | `00 Push notification` |

Design tokens in `src/app/globals.css` are copied 1:1 from the Figma variable collection `Laelaps Mobile` (Light and Dark modes). The UI is neutral; colour only marks severity (high red, medium orange, low grey) and the acknowledged state (green). Severity is always shown three ways: the rail on top of the bar, the badge with a text label, and the detection box.

## Fixtures

| Key | Product | Severity | Notes |
|---|---|---|---|
| `cameraHigh` | `camera_vlm` | high | Two outcomes require a note |
| `accessMedium` | `access_control` | medium | No "Keep observing" |
| `cameraLowObserved` | `camera_vlm` | low | `ackObservingAt` set, observed by Lars R. |

## Voice note

The mic in the note field records audio (`MediaRecorder`) and transcribes it (Web Speech API, `de-CH` or `en-US`). When you stop, the transcript is moved into the note, appended to anything already typed, and the recording stays playable from the "Voice note · 0:07" chip. Where speech recognition is not available (Firefox, embedded browsers, no microphone permission), a demo transcript from the messages file is "spoken" word by word so the flow can still be tried. The engine is injectable (`voiceEngineFactory`) so tests run without a microphone.

## Decisions worth knowing

- **Times are 24-hour** in every locale. 12-hour "01:33 PM" broke the layout, and control rooms use 24-hour.
- **Event content stays as delivered.** Title, summary, site and detection label come from the backend or the vision model, so they are not translated. All UI chrome and outcome labels go through `t()`. Outcome labels use `outcomes.<id>`, with the backend label as a fallback for unknown ids.
- **The sheet anchors to the event screen**, not the viewport, so it stays inside the phone frame on desktop.
- **Tap targets:** primary 56px, others 48px, icon buttons have at least a 44px hit area even when the visual is 36px.
- **Reduced motion** turns off the sheet slide, waveform and pulse.

Built with Next.js 16 (static export), React 19, next-intl 4, Vitest and Testing Library.
