import { useFormatter, useTranslations } from "next-intl";
import { Icon } from "@/components/Icon/Icon";
import { initials } from "@/lib/ack-rules";
import styles from "./ObservingBanner.module.css";

type Props = {
  /** Name of the colleague observing. null when it is the current operator. */
  name: string | null;
  since: string;
};

// Figma: "Observing banner". Who is watching and since when; acknowledging stays possible.
export const ObservingBanner = ({ name, since }: Props) => {
  const t = useTranslations("ackBar");
  const format = useFormatter();
  const time = format.dateTime(new Date(since), { hour: "2-digit", hourCycle: "h23", minute: "2-digit" });

  return (
    <div className={styles.banner} role="status">
      <span className={styles.avatar} aria-hidden="true">
        {name ? initials(name) : <Icon name="eye" size={14} />}
      </span>
      <div className={styles.text}>
        <p className={styles.title}>{name ? t("observedBy", { name }) : t("observedByYou")}</p>
        <p className={styles.since}>{t("observingSince", { time })}</p>
      </div>
      <Icon name="eye" size={18} className={styles.eye} />
    </div>
  );
};
