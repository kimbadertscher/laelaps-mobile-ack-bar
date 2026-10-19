import { useTranslations } from "next-intl";
import type { Severity } from "@/data/types";
import styles from "./SeverityBadge.module.css";

// Figma: Badge/high · Badge/medium · Badge/low. Colour is never the only signal: dot + text label.
export const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const t = useTranslations("severity");
  return (
    <span className={styles.badge} data-severity={severity}>
      <span className={styles.dot} aria-hidden="true" />
      {t(severity)}
    </span>
  );
};
