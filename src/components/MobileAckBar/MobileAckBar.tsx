"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/Button/Button";
import { Icon } from "@/components/Icon/Icon";
import { ObservingBanner } from "@/components/ObservingBanner/ObservingBanner";
import type { AckEvent, AckPayload, Person } from "@/data/types";
import { canKeepObserving, isAcknowledged, isObserved } from "@/lib/ack-rules";
import { useOutcomeLabel } from "@/lib/use-outcome-label";
import type { VoiceEngineFactory } from "@/lib/voice-engine";
import { AckSheet } from "./AckSheet";
import styles from "./MobileAckBar.module.css";

export type MobileAckBarProps = {
  event: AckEvent;
  currentUser: Person;
  onAcknowledge: (payload: AckPayload) => void;
  /** true = mark "I am watching" (non-final), false = stop. Only called for camera_vlm events. */
  onObservingChange: (observing: boolean) => void;
  onBack?: () => void;
  voiceEngineFactory?: VoiceEngineFactory;
};

/**
 * Mobile replacement for the desktop AckFooter (which only appears on hover or keyboard focus).
 * Always visible at the bottom of the event page, inside thumb reach.
 * Figma: "MobileAckBar" + "Ack sheet".
 */
export const MobileAckBar = ({ event, currentUser, onAcknowledge, onObservingChange, onBack, voiceEngineFactory }: MobileAckBarProps) => {
  const t = useTranslations("ackBar");
  const format = useFormatter();
  const outcomeLabel = useOutcomeLabel();
  const [sheetOpen, setSheetOpen] = useState(false);
  const acknowledgeRef = useRef<HTMLButtonElement>(null);

  const closeSheet = () => {
    setSheetOpen(false);
    requestAnimationFrame(() => acknowledgeRef.current?.focus());
  };

  if (isAcknowledged(event)) {
    const outcome = event.outcomes.find((item) => item.id === event.acknowledgedOutcomeId);
    const byName = event.acknowledgedBy?.id === currentUser.id ? t("you") : (event.acknowledgedBy?.name ?? "");
    return (
      <section className={styles.bar} data-state="acknowledged" aria-label={t("region")}>
        <span className={styles.rail} aria-hidden="true" />
        <div className={styles.inner}>
          <div className={styles.done} role="status">
            <span className={styles.doneIcon} aria-hidden="true">
              <Icon name="check" size={18} />
            </span>
            <div>
              <p className={styles.doneTitle}>{t("acknowledged", { outcome: outcome ? outcomeLabel(outcome) : "" })}</p>
              <p className={styles.doneMeta}>
                {t("acknowledgedBy", {
                  name: byName,
                  time: format.dateTime(new Date(event.acknowledgedAt ?? Date.now()), { hour: "2-digit", hourCycle: "h23", minute: "2-digit" }),
                })}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="md" onClick={onBack}>
            {t("backToEvents")}
          </Button>
        </div>
      </section>
    );
  }

  const observedBySelf = event.ackObservingBy?.id === currentUser.id;

  return (
    <section className={styles.bar} data-severity={event.severity} aria-label={t("region")}>
      <span className={styles.rail} aria-hidden="true" />
      <div className={styles.inner}>
        {isObserved(event) && event.ackObservingAt && (
          <ObservingBanner name={observedBySelf ? null : (event.ackObservingBy?.name ?? null)} since={event.ackObservingAt} />
        )}
        {canKeepObserving(event) &&
          (observedBySelf ? (
            <Button variant="ghost" size="sm" icon="eye" onClick={() => onObservingChange(false)}>
              {t("stopObserving")}
            </Button>
          ) : (
            <Button variant="secondary" size="md" icon="eye" onClick={() => onObservingChange(true)}>
              {t("keepObserving")}
            </Button>
          ))}
        <Button ref={acknowledgeRef} variant="primary" size="lg" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
          {t("acknowledge")}
        </Button>
      </div>

      {sheetOpen && (
        <AckSheet
          event={event}
          onClose={closeSheet}
          onConfirm={(payload) => {
            setSheetOpen(false);
            onAcknowledge(payload);
          }}
          voiceEngineFactory={voiceEngineFactory}
        />
      )}
    </section>
  );
};
