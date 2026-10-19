"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";
import { Icon } from "@/components/Icon/Icon";
import type { AckEvent } from "@/data/types";
import styles from "./PushNotification.module.css";

// Figma: "00 Push notification". 03:00 lock screen, tap the notification to land on the event page.
export const PushNotification = ({ event, onOpen }: { event: AckEvent; onOpen: () => void }) => {
  const t = useTranslations("push");
  const ts = useTranslations("severity");
  const format = useFormatter();
  const now = useNow({ updateInterval: 10_000 });
  const occurred = format.dateTime(new Date(event.occurredAt), { hour: "2-digit", hourCycle: "h23", minute: "2-digit" });

  return (
    <div className={styles.screen}>
      <p className={styles.date}>{format.dateTime(now, { weekday: "long", day: "numeric", month: "long" })}</p>
      <p className={styles.clock}>{format.dateTime(now, { hour: "2-digit", hourCycle: "h23", minute: "2-digit" })}</p>

      <button type="button" className={styles.card} onClick={onOpen} aria-label={t("open", { title: event.title })}>
        <span className={styles.appIcon} aria-hidden="true">
          <Icon name="bell" size={20} />
        </span>
        <span className={styles.body}>
          <span className={styles.row}>
            <span className={styles.app}>{t("app")}</span>
            <span className={styles.now}>{t("now")}</span>
          </span>
          <span className={styles.title} data-severity={event.severity}>
            {t("title", { severity: ts(event.severity), site: event.site })}
          </span>
          <span className={styles.text}>{t("body", { title: event.title, source: event.source, time: occurred })}</span>
        </span>
      </button>
    </div>
  );
};
