# UI structure and localization

## Tailwind

Component styling uses Tailwind utilities. `src/app/globals.css` contains only the Tailwind import
and theme tokens for colors and fonts. There are no component selectors, CSS modules, or `@apply`
rules. Fontsource imports supply bundled font assets rather than application styling.

Small shared components cover buttons, icon buttons, inputs, labels, page titles, and the site header.
`cn` combines conditional utilities with `clsx` and resolves overrides with `tailwind-merge`.
Prettier's official Tailwind plugin sorts utilities. Long class lists are split into readable
arguments; the physical 300-line and 100-column checks still apply.

## Internationalization

`next-intl` supplies request configuration, client/server translations, ICU pluralization, number
formatting, and date/time formatting. `src/i18n/en/` holds English message catalogs by feature;
`src/types/i18n.ts` makes message keys type checked. TypeScript catalogs allow readable multiline
strings within the column limit. Complete sentences use parameters or rich-text placeholders.

The demo ships English only; it does not claim to provide another language or a language selector.
Adding a language requires its catalogs, extending the locale type, and choosing that locale in
`src/i18n/request.ts`. No locale prefixes are needed for the current reservation links.

UI labels, accessible labels, route states, scenarios, and confirmation email templates use catalogs.
ESLint rejects new raw JSX text and literal accessible labels. Counts use ICU plural rules; timestamps
use an explicit UTC zone and the delivery log labels that zone. Stay dates remain calendar dates.

Source data, payload JSON, persisted diagnostic messages, and existing emails are shown verbatim.
Those are audit evidence, not interface copy. API failures have localizable categories plus expandable
original diagnostic details. Email content is rendered in English at confirmation and persisted;
retries never regenerate it from possibly changed translations. A real multilingual provider adapter
would choose the guest's locale before creating that immutable payload.

## Other changes from the quality pass

- One shared header replaces duplicated dashboard/detail markup.
- Typed scenario IDs and a guard replace the unchecked scenario lookup and selection cast.
- A single form mode prevents update and cancellation forms being open together.
- Buttons default to `type="button"`; form submissions opt into `type="submit"` explicitly.
- Synchronization presentation compares reservation fields, rather than declaring a match from
  version equality alone. The list, summary, and comparison share the same field definitions.
- The API client handles network errors, non-JSON failures, and invalid success responses. Query
  cancellation is preserved both before headers and while reading the body.
- TanStack Query passes abort signals to fetch. Selecting another reservation clears stale actions.
- Confirmation formatting lives separately from the reservation lifecycle dispatcher.

The changes preserve the existing transaction, inbox, state-pattern, and provider-idempotency design.
Regression checks cover API failure boundaries, misleading synchronization states, pluralization,
complete titles, scenario catalog coverage, and the existing database/worker invariants.
