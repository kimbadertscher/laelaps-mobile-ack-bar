"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/Button/Button";
import { Icon } from "@/components/Icon/Icon";
import type { AckEvent, AckPayload, VoiceNote } from "@/data/types";
import { canConfirm } from "@/lib/ack-rules";
import { useOutcomeLabel } from "@/lib/use-outcome-label";
import type { VoiceEngineFactory } from "@/lib/voice-engine";
import { NoteField } from "./NoteField";
import { OutcomeRow } from "./OutcomeRow";
import styles from "./AckSheet.module.css";

type Props = {
  event: AckEvent;
  onClose: () => void;
  onConfirm: (payload: AckPayload) => void;
  voiceEngineFactory?: VoiceEngineFactory;
};

// Figma: "Ack sheet". Pick one outcome from event.outcomes, add a note when required, confirm.
export const AckSheet = ({ event, onClose, onConfirm, voiceEngineFactory }: Props) => {
  const t = useTranslations("sheet");
  const tv = useTranslations("voice");
  const outcomeLabel = useOutcomeLabel();
  const titleId = useId();
  const hintId = useId();
  const firstRadio = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [voiceNote, setVoiceNote] = useState<VoiceNote | null>(null);

  const selected = event.outcomes.find((outcome) => outcome.id === selectedId) ?? null;
  const valid = canConfirm(selected, note);
  const fallbackTranscript = tv.has(`demoTranscript.${event.id}`)
    ? tv(`demoTranscript.${event.id}`)
    : tv("demoTranscript.fallback");

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus the first outcome once on open; Escape closes from anywhere in the sheet.
  useEffect(() => {
    firstRadio.current?.focus();
    const onKey = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The transcript lands in the note. Text already typed is kept and the transcript is appended.
  const handleVoiceNote = useCallback((voice: VoiceNote) => {
    setVoiceNote(voice);
    if (voice.transcript) setNote((current) => (current.trim() ? `${current.trim()} ${voice.transcript}` : voice.transcript));
  }, []);

  const submit = () => {
    if (!selected || !valid) return;
    onConfirm({ outcomeId: selected.id, note: note.trim(), voiceNote });
  };

  return (
    <div className={styles.layer}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.grabber} aria-hidden="true" />
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 id={titleId} className={styles.title}>
              {t("title")}
            </h2>
            <p className={styles.subtitle}>{t("subtitle", { title: event.title, source: event.source })}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t("close")}>
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className={styles.scroll}>
          <fieldset className={styles.outcomes}>
            <legend className="eyebrow">{t("whatHappened")}</legend>
            {event.outcomes.map((outcome, index) => (
              <OutcomeRow
                key={outcome.id}
                outcome={outcome}
                label={outcomeLabel(outcome)}
                checked={outcome.id === selectedId}
                onSelect={setSelectedId}
                inputRef={index === 0 ? firstRadio : undefined}
              />
            ))}
          </fieldset>

          {selected && (
            <NoteField
              required={selected.requiresNote}
              value={note}
              onChange={setNote}
              voiceNote={voiceNote}
              onVoiceNote={handleVoiceNote}
              fallbackTranscript={fallbackTranscript}
              engineFactory={voiceEngineFactory}
              describedBy={!valid ? hintId : undefined}
            />
          )}
        </div>

        <footer className={styles.footer}>
          <Button variant="primary" size="lg" icon={valid ? "check" : undefined} disabled={!valid} onClick={submit} aria-describedby={!valid ? hintId : undefined}>
            {selected ? t("confirmWith", { outcome: outcomeLabel(selected) }) : t("confirm")}
          </Button>
          {!valid && (
            <p id={hintId} className={styles.footerHint}>
              {selected ? t("addNote") : t("chooseOutcome")}
            </p>
          )}
        </footer>
      </div>
    </div>
  );
};
