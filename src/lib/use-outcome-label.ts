"use client";

import { useTranslations } from "next-intl";
import type { Outcome } from "@/data/types";

/** Outcome labels go through t(); the backend label is only a fallback for ids we have no key for. */
export const useOutcomeLabel = () => {
  const t = useTranslations("outcomes");
  return (outcome: Outcome) => (t.has(outcome.id) ? t(outcome.id) : outcome.label);
};
