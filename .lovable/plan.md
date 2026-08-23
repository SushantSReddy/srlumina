# Claude-inspired theme + theme switcher

Add a second visual theme to the app, inspired by the Claude app, and let the user switch between themes. Nothing else changes — no layout, feature, or logic changes.

## What the user gets

- A **Theme** section in Settings with two choices: **Default** (current iOS-style look) and **Claude** (warm, paper-like).
- Each theme still supports light and dark; the existing sun/moon toggle in the header keeps working.
- The choice is remembered on the device across sessions.

## The Claude theme look

- Warm ivory/paper background with clay-orange accent, soft warm borders, very low-contrast surfaces.
- Dark mode: deep warm charcoal background with the same clay accent.
- Typography: serif for headings (Tiempos-like) + clean grotesque for body/UI (Styrene-like), loaded from Google Fonts (`Source Serif 4` + `Inter Tight`).
- Flatter styling than the default: less blur/glass shine, gentle borders, slightly tighter radii.

## Technical notes

- `src/styles.css`: add a `.theme-claude` class block (and `.dark.theme-claude` / `.theme-claude.dark` variants) overriding the existing CSS variables (`--background`, `--surface`, `--foreground`, `--primary`, `--border`, `--ios-*` accents, `--radius`) plus a font-family override and softened `glass` treatment. No token names change, so every component picks it up automatically.
- `src/routes/__root.tsx`: add the Google Fonts `<link>` tags in the root `head()` links array, and apply the stored theme class (`localStorage` key `app-theme`) to `document.documentElement` in the existing theme `useEffect`, alongside the current dark-mode handling.
- New small `src/components/tracker/ThemePicker.tsx`: two tappable preview cards that set the class and persist the choice.
- `src/routes/_authenticated/settings.tsx`: render `<ThemePicker />` inside a new `Group title="Theme"`.
- Fonts are loaded via `<link>` in the root head (never `@import` a URL in `styles.css`).
