"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/Icon/Icon";
import type { AckEvent } from "@/data/types";
import styles from "./CameraFrame.module.css";

// Figma: "Camera frame". Placeholder for the WebRTC still/clip; the detection box comes from the VLM result.
export const CameraFrame = ({ event }: { event: AckEvent }) => {
  const t = useTranslations("event");
  const format = useFormatter();
  const [expanded, setExpanded] = useState(false);
  const time = format.dateTime(new Date(event.occurredAt), { hour: "2-digit", hourCycle: "h23", minute: "2-digit", second: "2-digit" });

  return (
    <figure
      className={styles.frame}
      data-expanded={expanded}
      data-severity={event.severity}
      aria-label={t("frameLabel", { source: event.source })}
    >
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.floor} />
        {event.detection && (
          <div className={styles.detection}>
            <span className={styles.detectionLabel}>
              {t("detection", {
                label: event.detection.label,
                confidence: format.number(event.detection.confidence, { maximumFractionDigits: 2 }),
              })}
            </span>
          </div>
        )}
      </div>
      <span className={`${styles.pill} ${styles.topLeft}`}>{event.source}</span>
      <time className={`${styles.pill} ${styles.topRight}`} dateTime={event.occurredAt}>
        {time}
      </time>
      <button
        type="button"
        className={styles.expand}
        onClick={() => setExpanded((value) => !value)}
        aria-label={expanded ? t("collapse") : t("expand")}
        aria-pressed={expanded}
      >
        <Icon name={expanded ? "collapse" : "expand"} size={16} />
      </button>
    </figure>
  );
};
