"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { EventPage } from "@/components/EventPage/EventPage";
import { Icon } from "@/components/Icon/Icon";
import { PushNotification } from "@/components/PushNotification/PushNotification";
import { createFixtures, currentUser, fixtureKeys, type FixtureKey } from "@/data/fixtures";
import type { AckEvent, AckPayload } from "@/data/types";
import { IntlProvider, locales, type Locale } from "@/i18n/IntlProvider";
import styles from "./PrototypeApp.module.css";

type Theme = "dark" | "light";
type Screen = "push" | "event";

const FIGMA_URL = "https://www.figma.com/design/nR1pIuqbgWhxllQ6IdWIFm/Mobile-Acknowledge?node-id=4-92";
const REPO_URL = "https://github.com/kimbadertscher/laelaps-mobile-ack-bar";

export const PrototypeApp = () => {
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
  }, [theme, locale]);

  return (
    <IntlProvider locale={locale}>
      <Prototype theme={theme} onTheme={setTheme} locale={locale} onLocale={setLocale} />
    </IntlProvider>
  );
};

type PrototypeProps = {
  theme: Theme;
  onTheme: (theme: Theme) => void;
  locale: Locale;
  onLocale: (locale: Locale) => void;
};

const Prototype = ({ theme, onTheme, locale, onLocale }: PrototypeProps) => {
  const t = useTranslations("demo");
  const [events, setEvents] = useState(() => createFixtures());
  const [fixtureKey, setFixtureKey] = useState<FixtureKey>("cameraHigh");
  const [screen, setScreen] = useState<Screen>("push");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const event = events[fixtureKey];

  const update = (patch: Partial<AckEvent>) =>
    setEvents((previous) => ({ ...previous, [fixtureKey]: { ...previous[fixtureKey], ...patch } }));

  const acknowledge = ({ outcomeId, note }: AckPayload) =>
    update({
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: currentUser,
      acknowledgedOutcomeId: outcomeId,
      acknowledgedNote: note,
    });

  const setObserving = (observing: boolean) =>
    update(
      observing
        ? { ackObservingAt: new Date().toISOString(), ackObservingBy: currentUser }
        : { ackObservingAt: null, ackObservingBy: null },
    );

  const reset = () => {
    setEvents(createFixtures());
    setScreen("push");
  };

  const controls = (
    <Controls
      fixtureKey={fixtureKey}
      onFixture={(key) => setFixtureKey(key)}
      screen={screen}
      onScreen={setScreen}
      theme={theme}
      onTheme={onTheme}
      locale={locale}
      onLocale={onLocale}
      onReset={reset}
    />
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.panel}>
        <h1 className={styles.heading}>{t("heading")}</h1>
        <p className={styles.intro}>{t("intro")}</p>
        {controls}
        <nav className={styles.links}>
          <a href={FIGMA_URL} target="_blank" rel="noreferrer">
            {t("figma")}
          </a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            {t("source")}
          </a>
        </nav>
      </aside>

      <div className={styles.phone}>
        <StatusBar />
        <div className={styles.viewport}>
          {screen === "push" ? (
            <PushNotification event={event} onOpen={() => setScreen("event")} />
          ) : (
            <EventPage
              key={event.id}
              event={event}
              currentUser={currentUser}
              onAcknowledge={acknowledge}
              onObservingChange={setObserving}
              onBack={() => setScreen("push")}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}
          {settingsOpen && (
            <div className={styles.settingsLayer}>
              <div className={styles.settingsScrim} onClick={() => setSettingsOpen(false)} aria-hidden="true" />
              <div className={styles.settings} role="dialog" aria-modal="true" aria-label={t("heading")}>
                <div className={styles.settingsHeader}>
                  <h2>{t("heading")}</h2>
                  <button type="button" onClick={() => setSettingsOpen(false)} aria-label={t("close")}>
                    <Icon name="x" size={18} />
                  </button>
                </div>
                {controls}
              </div>
            </div>
          )}
        </div>
        <span className={styles.homeIndicator} aria-hidden="true" />
      </div>
    </div>
  );
};

const StatusBar = () => {
  const format = useFormatter();
  const now = useNow({ updateInterval: 10_000 });
  return (
    <div className={styles.statusBar} aria-hidden="true">
      <span>{format.dateTime(now, { hour: "2-digit", hourCycle: "h23", minute: "2-digit" })}</span>
      <span className={styles.statusIcons}>
        <i />
        <i />
        <b />
      </span>
    </div>
  );
};

type ControlsProps = {
  fixtureKey: FixtureKey;
  onFixture: (key: FixtureKey) => void;
  screen: Screen;
  onScreen: (screen: Screen) => void;
  theme: Theme;
  onTheme: (theme: Theme) => void;
  locale: Locale;
  onLocale: (locale: Locale) => void;
  onReset: () => void;
};

const Controls = (props: ControlsProps) => {
  const t = useTranslations("demo");
  return (
    <div className={styles.controls}>
      <Segmented
        label={t("fixture")}
        value={props.fixtureKey}
        options={fixtureKeys.map((key) => ({ value: key, label: t(`fixtures.${key}`) }))}
        onChange={props.onFixture}
        vertical
      />
      <Segmented
        label={t("startAt")}
        value={props.screen}
        options={[
          { value: "push", label: t("push") },
          { value: "event", label: t("event") },
        ]}
        onChange={props.onScreen}
      />
      <Segmented
        label={t("theme")}
        value={props.theme}
        options={[
          { value: "dark", label: t("dark") },
          { value: "light", label: t("light") },
        ]}
        onChange={props.onTheme}
      />
      <Segmented
        label={t("language")}
        value={props.locale}
        options={locales.map((locale) => ({ value: locale, label: locale.toUpperCase() }))}
        onChange={props.onLocale}
      />
      <button type="button" className={styles.reset} onClick={props.onReset}>
        {t("reset")}
      </button>
    </div>
  );
};

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  vertical?: boolean;
};

const Segmented = <T extends string>({ label, value, options, onChange, vertical }: SegmentedProps<T>) => (
  <fieldset className={styles.segmented}>
    <legend className="eyebrow">{label}</legend>
    <div className={styles.segments} data-vertical={vertical}>
      {options.map((option) => (
        <label key={option.value} className={styles.segment} data-checked={option.value === value}>
          <input
            type="radio"
            name={label}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  </fieldset>
);
