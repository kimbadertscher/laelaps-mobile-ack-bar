"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceNote } from "@/data/types";
import { createBrowserVoiceEngine, type VoiceEngine, type VoiceEngineFactory } from "@/lib/voice-engine";

type Options = {
  fallbackTranscript: string;
  onDone: (note: VoiceNote) => void;
  engineFactory?: VoiceEngineFactory;
};

export type VoiceState = "idle" | "recording" | "error";

export const useVoiceNote = ({ fallbackTranscript, onDone, engineFactory = createBrowserVoiceEngine }: Options) => {
  const locale = useLocale();
  const [state, setState] = useState<VoiceState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [partial, setPartial] = useState("");
  const engineRef = useRef<VoiceEngine | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    if (state !== "recording") return;
    const id = setInterval(() => setSeconds((Date.now() - startedAt.current) / 1000), 250);
    return () => clearInterval(id);
  }, [state]);

  useEffect(() => () => engineRef.current?.cancel(), []);

  const start = useCallback(async () => {
    const engine = engineFactory({ lang: locale === "de" ? "de-CH" : "en-US", fallbackTranscript });
    engineRef.current = engine;
    startedAt.current = Date.now();
    setSeconds(0);
    setPartial("");
    setState("recording");
    try {
      await engine.start(setPartial);
    } catch {
      setState("error");
    }
  }, [engineFactory, fallbackTranscript, locale]);

  const stop = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const durationSec = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const result = await engine.stop();
    engineRef.current = null;
    setState("idle");
    onDone({ durationSec, audioUrl: result.audioUrl, transcript: result.transcript });
  }, [onDone]);

  return { state, seconds, partial, start, stop };
};
