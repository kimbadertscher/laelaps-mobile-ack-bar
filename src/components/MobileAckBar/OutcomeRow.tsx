"use client";

import { useTranslations } from "next-intl";
import type { Ref } from "react";
import type { Outcome } from "@/data/types";
import styles from "./AckSheet.module.css";

type Props = {
  outcome: Outcome;
  label: string;
  checked: boolean;
  onSelect: (id: string) => void;
  inputRef?: Ref<HTMLInputElement>;
};

// Figma: "Outcome row". A native radio inside a 56px label, so the whole row is the tap target.
export const OutcomeRow = ({ outcome, label, checked, onSelect, inputRef }: Props) => {
  const t = useTranslations("sheet");
  return (
    <label className={styles.outcome} data-checked={checked}>
      <input
        ref={inputRef}
        type="radio"
        name="outcome"
        value={outcome.id}
        checked={checked}
        onChange={() => onSelect(outcome.id)}
        className={styles.radioInput}
      />
      <span className={styles.radio} aria-hidden="true" />
      <span className={styles.outcomeLabel}>{label}</span>
      {outcome.requiresNote && <span className={styles.outcomeHint}>{t("noteRequired")}</span>}
    </label>
  );
};
