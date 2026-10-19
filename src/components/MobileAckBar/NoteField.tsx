"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon/Icon";
import type { VoiceNote } from "@/data/types";
import { useVoiceNote } from "@/hooks/useVoiceNote";
import { formatDuration } from "@/lib/ack-rules";
import type { VoiceEngineFactory } from "@/lib/voice-engine";
import styles from "./AckSheet.module.css";

type Props = {
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  voiceNote: VoiceNote | null;
  onVoiceNote: (note: VoiceNote) => void;
  fallbackTranscript: string;
  engineFactory?: VoiceEngineFactory;
  describedBy?: string;
};

const BARS = [6, 12, 20, 14, 26, 10, 18, 8, 22, 16, 12, 24, 9, 15, 6];

// Figma: "Note field/empty" · "Note field/recording" · "Note field/transcribed".
export const NoteField = ({ required, value, onChange, voiceNote, onVoiceNote, fallbackTranscript, engineFactory, describedBy }: Props) => {
  const t = useTranslations("sheet");
  const tv = useTranslations("voice");
  const voice = useVoiceNote({ fallbackTranscript, onDone: onVoiceNote, engineFactory });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const transcribed = voiceNote !== null && value.trim().length > 0;

  useEffect(() => () => audioRef.current?.pause(), []);

  const togglePlayback = () => {
    if (!voiceNote?.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(voiceNote.audioUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      void audioRef.current.play();
      setPlaying(true);
    }
  };

  const reRecord = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
    void voice.start();
  };

  return (
    <div className={styles.note}>
      <div className={styles.noteLabelRow}>
        <label htmlFor="ack-note" className="eyebrow">
          {t("note")}
        </label>
        <span className={`eyebrow ${required ? styles.required : ""}`}>{required ? t("required") : t("optional")}</span>
      </div>

      {voice.state === "recording" ? (
        <div className={styles.recording} role="status">
          <div className={styles.recordingTop}>
            <span className={styles.recDot} aria-hidden="true" />
            <span className={styles.recLabel}>{tv("recording")}</span>
            <span className={styles.recTime}>{formatDuration(voice.seconds)}</span>
            <span className={styles.wave} aria-hidden="true">
              {BARS.map((height, index) => (
                <span key={index} style={{ height, animationDelay: `${index * 70}ms` }} />
              ))}
            </span>
            <button type="button" className={styles.roundButton} onClick={() => void voice.stop()} aria-label={tv("stop")}>
              <Icon name="stop" size={20} />
            </button>
          </div>
          <p className={styles.recHelp}>{voice.partial || tv("recordingHelp")}</p>
        </div>
      ) : (
        <div className={styles.field} data-transcribed={transcribed}>
          <textarea
            id="ack-note"
            ref={textareaRef}
            className={styles.textarea}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={t("placeholder")}
            rows={value ? 4 : 2}
            aria-required={required}
            aria-describedby={describedBy}
          />
          <div className={styles.fieldFooter}>
            {voiceNote ? (
              <>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={togglePlayback}
                  disabled={!voiceNote.audioUrl}
                  aria-label={voiceNote.audioUrl ? (playing ? tv("pause") : tv("play")) : undefined}
                >
                  <Icon name={voiceNote.audioUrl ? (playing ? "pause" : "play") : "mic"} size={14} />
                  {tv("voiceNote", { duration: formatDuration(voiceNote.durationSec) })}
                </button>
                <button type="button" className={styles.linkButton} onClick={reRecord}>
                  {tv("rerecord")}
                </button>
              </>
            ) : (
              <>
                <span className={styles.fieldHint}>{voice.state === "error" ? tv("unavailable") : t("hint")}</span>
                <button type="button" className={styles.roundButton} onClick={() => void voice.start()} aria-label={tv("start")}>
                  <Icon name="mic" size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
