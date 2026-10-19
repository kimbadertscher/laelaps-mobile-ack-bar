import { useFormatter, useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/Icon/Icon";
import type { AckEvent } from "@/data/types";
import styles from "./EventMeta.module.css";

// Figma: "Meta". Location, camera or reader, time. Labels stay for screen readers only.
export const EventMeta = ({ event }: { event: AckEvent }) => {
  const t = useTranslations("event");
  const format = useFormatter();
  const occurred = new Date(event.occurredAt);
  const rows: { icon: IconName; label: string; value: string }[] = [
    { icon: "pin", label: t("location"), value: `${event.site} · ${event.zone}` },
    {
      icon: event.product === "camera_vlm" ? "camera" : "door",
      label: t(`source.${event.product}`),
      value: `${event.source} · ${event.sourceDetail}`,
    },
    {
      icon: "clock",
      label: t("time"),
      value: `${format.dateTime(occurred, { hour: "2-digit", hourCycle: "h23", minute: "2-digit", second: "2-digit" })} · ${format.dateTime(occurred, { weekday: "short", day: "numeric", month: "short" })}`,
    },
  ];

  return (
    <dl className={styles.meta} aria-label={t("metaLabel")}>
      {rows.map((row) => (
        <div key={row.icon} className={styles.row}>
          <Icon name={row.icon} size={20} className={styles.icon} />
          <dt className="sr-only">{row.label}</dt>
          <dd className={styles.value}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
};
