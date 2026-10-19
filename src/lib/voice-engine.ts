// Voice note capture: records audio (MediaRecorder) and transcribes it (Web Speech API).
// When speech recognition is not available (Firefox, desktop Safari, tests), the engine
// "speaks" a demo transcript word by word so the flow can still be tried end to end.

export type VoiceResult = { transcript: string; audioUrl: string | null };

export type VoiceEngine = {
  start: (onPartial: (text: string) => void) => Promise<void>;
  stop: () => Promise<VoiceResult>;
  cancel: () => void;
};

export type VoiceEngineFactory = (options: { lang: string; fallbackTranscript: string }) => VoiceEngine;

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

const getRecognitionConstructor = (): (new () => Recognition) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const createBrowserVoiceEngine: VoiceEngineFactory = ({ lang, fallbackTranscript }) => {
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  const chunks: Blob[] = [];
  let recognition: Recognition | null = null;
  let recognitionEnded: Promise<void> = Promise.resolve();
  let finalText = "";
  let interimText = "";
  let simulationTimer: ReturnType<typeof setInterval> | null = null;

  const stopTracks = () => stream?.getTracks().forEach((track) => track.stop());

  return {
    async start(onPartial) {
      const simulate = () => {
        if (simulationTimer) return;
        const words = fallbackTranscript.split(" ");
        let count = 0;
        simulationTimer = setInterval(() => {
          count = Math.min(words.length, count + 1);
          finalText = words.slice(0, count).join(" ");
          onPartial(finalText);
          if (count >= words.length && simulationTimer) clearInterval(simulationTimer);
        }, 180);
      };

      try {
        // A blocked permission prompt can leave getUserMedia pending forever, so give up after 4 s.
        stream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ audio: true }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
        ]);
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => chunks.push(event.data);
        recorder.start();
      } catch {
        stream = null;
        recorder = null;
      }

      const RecognitionCtor = getRecognitionConstructor();
      if (!RecognitionCtor || !stream) return simulate();

      let heardSomething = false;
      recognition = new RecognitionCtor();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        heardSomething = true;
        finalText = "";
        interimText = "";
        for (const result of Array.from(event.results)) {
          if (result.isFinal) finalText += result[0].transcript;
          else interimText += result[0].transcript;
        }
        onPartial(`${finalText} ${interimText}`.trim());
      };
      // Speech service unreachable (offline, embedded browser): keep the audio, simulate the text.
      recognition.onerror = () => {
        if (!heardSomething) simulate();
      };
      const current = recognition;
      recognitionEnded = new Promise((resolve) => {
        current.onend = () => resolve();
      });
      recognition.start();
    },

    async stop() {
      if (simulationTimer) {
        clearInterval(simulationTimer);
        // Simulation: stopping early still hands over the full demo sentence.
        finalText = fallbackTranscript;
      }
      if (recognition) {
        recognition.stop();
        await Promise.race([recognitionEnded, new Promise((resolve) => setTimeout(resolve, 800))]);
      }
      const audioUrl = await new Promise<string | null>((resolve) => {
        if (!recorder || recorder.state === "inactive") return resolve(null);
        const active = recorder;
        active.onstop = () => resolve(URL.createObjectURL(new Blob(chunks, { type: active.mimeType })));
        active.stop();
      });
      stopTracks();
      return { transcript: `${finalText} ${interimText}`.trim(), audioUrl };
    },

    cancel() {
      if (simulationTimer) clearInterval(simulationTimer);
      recognition?.abort();
      if (recorder && recorder.state !== "inactive") recorder.stop();
      stopTracks();
    },
  };
};
