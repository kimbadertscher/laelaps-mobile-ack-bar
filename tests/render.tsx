import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { IntlProvider, type Locale } from "@/i18n/IntlProvider";

/** Renders inside next-intl. Any missing message key throws, so a test fails instead of showing a raw key. */
export const renderWithIntl = (ui: ReactElement, locale: Locale = "en") =>
  render(
    <IntlProvider
      locale={locale}
      onError={(error) => {
        throw error;
      }}
    >
      {ui}
    </IntlProvider>,
  );
