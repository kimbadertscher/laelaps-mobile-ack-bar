import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MobileAckBar } from "@/components/MobileAckBar/MobileAckBar";
import { createFixtures, currentUser, fixtureKeys } from "@/data/fixtures";
import type { AckEvent } from "@/data/types";
import type { Locale } from "@/i18n/IntlProvider";
import type { VoiceEngineFactory } from "@/lib/voice-engine";
import { renderWithIntl } from "./render";

const fixtures = createFixtures(new Date("2026-10-19T01:04:00Z"));

const setup = (event: AckEvent, { locale = "en" as Locale, voiceEngineFactory }: { locale?: Locale; voiceEngineFactory?: VoiceEngineFactory } = {}) => {
  const onAcknowledge = vi.fn();
  const onObservingChange = vi.fn();
  const user = userEvent.setup();
  renderWithIntl(
    <MobileAckBar
      event={event}
      currentUser={currentUser}
      onAcknowledge={onAcknowledge}
      onObservingChange={onObservingChange}
      voiceEngineFactory={voiceEngineFactory}
    />,
    locale,
  );
  return { user, onAcknowledge, onObservingChange };
};

const openSheet = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Acknowledge" }));
  return screen.getByRole("dialog", { name: "Acknowledge event" });
};

describe("MobileAckBar · all three fixtures", () => {
  it.each(fixtureKeys.flatMap((key) => (["en", "de"] as const).map((locale) => [key, locale] as const)))(
    "renders %s in %s without missing messages",
    (key, locale) => {
      setup(fixtures[key], { locale });
      expect(screen.getByRole("region")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: locale === "en" ? "Acknowledge" : "Quittieren" })).toBeEnabled();
    },
  );

  it.each(fixtureKeys)("lists exactly the outcomes from fixture.outcomes for %s, in order", async (key) => {
    const { user } = setup(fixtures[key]);
    const dialog = await openSheet(user);
    const radios = within(dialog).getAllByRole("radio");
    expect(radios.map((radio) => (radio as HTMLInputElement).value)).toEqual(fixtures[key].outcomes.map((o) => o.id));
  });
});

describe("picking and confirming", () => {
  it("keeps confirm disabled until an outcome is picked", async () => {
    const { user, onAcknowledge } = setup(fixtures.cameraHigh);
    const dialog = await openSheet(user);
    const confirm = within(dialog).getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();
    expect(within(dialog).getByText("Choose an outcome to continue")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("radio", { name: /False alarm/ }));
    const enabled = within(dialog).getByRole("button", { name: "Confirm · False alarm" });
    expect(enabled).toBeEnabled();
    await user.click(enabled);
    expect(onAcknowledge).toHaveBeenCalledWith({ outcomeId: "false_alarm", note: "", voiceNote: null });
  });

  it("blocks a requiresNote outcome until a note is written, whitespace does not count", async () => {
    const { user, onAcknowledge } = setup(fixtures.cameraHigh);
    const dialog = await openSheet(user);
    await user.click(within(dialog).getByRole("radio", { name: /Confirmed intrusion/ }));

    const confirm = within(dialog).getByRole("button", { name: "Confirm · Confirmed intrusion" });
    expect(confirm).toBeDisabled();
    expect(within(dialog).getByText("Add a note to confirm")).toBeInTheDocument();

    const note = within(dialog).getByRole("textbox", { name: "Note" });
    expect(note).toHaveAttribute("aria-required", "true");
    await user.type(note, "   ");
    expect(confirm).toBeDisabled();

    await user.type(note, "Person at the control panel");
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onAcknowledge).toHaveBeenCalledWith({ outcomeId: "confirmed_intrusion", note: "Person at the control panel", voiceNote: null });
  });

  it("applies the note rule to access events too", async () => {
    const { user } = setup(fixtures.accessMedium);
    const dialog = await openSheet(user);
    await user.click(within(dialog).getByRole("radio", { name: /Unauthorized entry/ }));
    expect(within(dialog).getByRole("button", { name: "Confirm · Unauthorized entry" })).toBeDisabled();
    await user.click(within(dialog).getByRole("radio", { name: /Reader fault/ }));
    expect(within(dialog).getByRole("button", { name: "Confirm · Reader fault" })).toBeEnabled();
  });

  it("closes the sheet with Escape and the close button without acknowledging", async () => {
    const { user, onAcknowledge } = setup(fixtures.cameraHigh);
    await openSheet(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const dialog = await openSheet(user);
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onAcknowledge).not.toHaveBeenCalled();
  });
});

describe("keep observing", () => {
  it("is offered for camera_vlm and marks observing", async () => {
    const { user, onObservingChange } = setup(fixtures.cameraHigh);
    await user.click(screen.getByRole("button", { name: "Keep observing" }));
    expect(onObservingChange).toHaveBeenCalledWith(true);
  });

  it("is never offered for access_control", async () => {
    const { user } = setup(fixtures.accessMedium);
    expect(screen.queryByRole("button", { name: /observing/i })).not.toBeInTheDocument();
    await openSheet(user);
    expect(screen.queryByText(/observing/i)).not.toBeInTheDocument();
  });

  it("offers stop observing when the current operator is the observer", async () => {
    const event = { ...fixtures.cameraHigh, ackObservingAt: "2026-10-19T01:05:00Z", ackObservingBy: currentUser };
    const { user, onObservingChange } = setup(event);
    expect(screen.getByText("You are observing")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Stop observing" }));
    expect(onObservingChange).toHaveBeenCalledWith(false);
  });
});

describe("event being observed (ackObservingAt set)", () => {
  it("shows who is observing and since when", () => {
    setup(fixtures.cameraLowObserved);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Lars R. is observing");
    // 4 minutes before 01:04 UTC is 03:00 in Zurich.
    expect(status).toHaveTextContent("since 03:00");
  });

  it("can still be acknowledged", async () => {
    const { user, onAcknowledge } = setup(fixtures.cameraLowObserved);
    const dialog = await openSheet(user);
    await user.click(within(dialog).getByRole("radio", { name: /Known delivery/ }));
    await user.click(within(dialog).getByRole("button", { name: "Confirm · Known delivery" }));
    expect(onAcknowledge).toHaveBeenCalledWith({ outcomeId: "known_delivery", note: "", voiceNote: null });
  });
});

describe("voice note", () => {
  const fakeEngine: VoiceEngineFactory = () => {
    let partial: (text: string) => void = () => undefined;
    return {
      start: async (onPartial) => {
        partial = onPartial;
        partial("Person crouching");
      },
      stop: async () => ({ transcript: "Person crouching at the control panel", audioUrl: "blob:voice-note" }),
      cancel: () => undefined,
    };
  };

  it("records, then moves the transcript into the note so a requiresNote outcome can be confirmed", async () => {
    const { user, onAcknowledge } = setup(fixtures.cameraHigh, { voiceEngineFactory: fakeEngine });
    const dialog = await openSheet(user);
    await user.click(within(dialog).getByRole("radio", { name: /Confirmed intrusion/ }));

    await user.click(within(dialog).getByRole("button", { name: "Dictate note" }));
    expect(within(dialog).getByText("Recording")).toBeInTheDocument();
    expect(within(dialog).getByText("Person crouching")).toBeInTheDocument();

    await act(async () => {
      await user.click(within(dialog).getByRole("button", { name: "Stop recording" }));
    });

    expect(within(dialog).getByRole("textbox", { name: "Note" })).toHaveValue("Person crouching at the control panel");
    expect(within(dialog).getByRole("button", { name: "Play voice note" })).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Confirm · Confirmed intrusion" }));
    expect(onAcknowledge).toHaveBeenCalledWith(
      expect.objectContaining({
        outcomeId: "confirmed_intrusion",
        note: "Person crouching at the control panel",
        voiceNote: expect.objectContaining({ audioUrl: "blob:voice-note", transcript: "Person crouching at the control panel" }),
      }),
    );
  });

  it("appends the transcript to text that was already typed", async () => {
    const { user } = setup(fixtures.cameraHigh, { voiceEngineFactory: fakeEngine });
    const dialog = await openSheet(user);
    await user.click(within(dialog).getByRole("radio", { name: /Needs follow-up/ }));
    await user.type(within(dialog).getByRole("textbox", { name: "Note" }), "Called site lead.");
    await user.click(within(dialog).getByRole("button", { name: "Dictate note" }));
    await act(async () => {
      await user.click(within(dialog).getByRole("button", { name: "Stop recording" }));
    });
    expect(within(dialog).getByRole("textbox", { name: "Note" })).toHaveValue("Called site lead. Person crouching at the control panel");
  });
});

describe("acknowledged", () => {
  it("shows the outcome and who acknowledged instead of the actions", () => {
    setup({
      ...fixtures.cameraHigh,
      acknowledgedAt: "2026-10-19T01:05:00Z",
      acknowledgedBy: currentUser,
      acknowledgedOutcomeId: "false_alarm",
      acknowledgedNote: "",
    });
    expect(screen.getByRole("status")).toHaveTextContent("Acknowledged · False alarm");
    expect(screen.getByRole("status")).toHaveTextContent("by you · 03:05");
    expect(screen.queryByRole("button", { name: "Acknowledge" })).not.toBeInTheDocument();
  });
});
