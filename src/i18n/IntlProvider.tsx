"use client";

import { NextIntlClientProvider, type IntlError } from "next-intl";
import type { ReactNode } from "react";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

export const messagesByLocale = { en, de } as const;
export type Locale = keyof typeof messagesByLocale;
export const locales = Object.keys(messagesByLocale) as Locale[];
export const timeZone = "Europe/Zurich";

type Props = {
  locale: Locale;
  children: ReactNode;
  onError?: (error: IntlError) => void;
};

/** Client-side provider so the prototype can switch language without routing and still export statically. */
export const IntlProvider = ({ locale, children, onError }: Props) => (
  <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]} timeZone={timeZone} onError={onError}>
    {children}
  </NextIntlClientProvider>
);
