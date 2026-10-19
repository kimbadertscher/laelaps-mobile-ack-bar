"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";
import { CameraFrame } from "@/components/CameraFrame/CameraFrame";
import { EventMeta } from "@/components/EventMeta/EventMeta";
import { Icon } from "@/components/Icon/Icon";
import { MobileAckBar, type MobileAckBarProps } from "@/components/MobileAckBar/MobileAckBar";
import { SeverityBadge } from "@/components/SeverityBadge/SeverityBadge";
import styles from "./EventPage.module.css";

type Props = MobileAckBarProps & {
  onOpenSettings: () => void;
};

// Figma: "01 Event · camera high" and siblings. Where the push notification lands.
export const EventPage = ({ onOpenSettings, ...barProps }: Props) => {
  const { event, onBack } = barProps;
  const t = useTranslations("event");
  const format = useFormatter();
  const now = useNow({ updateInterval: 30_000 });

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.iconButton} onClick={onBack} aria-label={t("back")}>
          <Icon name="back" size={24} />
        </button>
        <h1 className={styles.headerTitle}>{t("screenTitle")}</h1>
        <button type="button" className={styles.iconButton} onClick={onOpenSettings} aria-label={t("more")}>
          <Icon name="dots" size={24} />
        </button>
      </header>

      <main className={styles.content}>
        <CameraFrame event={event} />
        <div className={styles.tags}>
          <SeverityBadge severity={event.severity} />
          <span>{t(`product.${event.product}`)}</span>
          <span aria-hidden="true" className={styles.sep}>
            ·
          </span>
          <time dateTime={event.occurredAt}>{format.relativeTime(new Date(event.occurredAt), { now, style: "short" })}</time>
        </div>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>{event.title}</h2>
          <p className={styles.summary}>{event.summary}</p>
        </div>
        <EventMeta event={event} />
      </main>

      <MobileAckBar {...barProps} />
    </div>
  );
};
