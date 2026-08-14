# Publishing SR Lumina to Google Play (TWA)

The app ships as a Trusted Web Activity: a thin Android wrapper around the live site
at https://srlumina.lovable.app. All app code stays here; the Play build only points at the URL.

## 1. Build the Android package

Requires Node 18+ and a JDK 17.

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest=https://srlumina.lovable.app/manifest.webmanifest
# When asked, accept the values already in twa-manifest.json (copy it into the build folder to reuse them)
bubblewrap build
```

Outputs `app-release-bundle.aab` (upload this) and `app-release-signed.apk` (for local testing).
Keep `android.keystore` and its passwords safe — losing them means you can never update the listing.

## 2. Verify domain ownership (removes the browser URL bar)

1. Get the signing fingerprint:
   - From your local key: `keytool -list -v -keystore android.keystore -alias android`
   - Or, after the first upload, from Play Console → Release → Setup → App signing (use the
     **App signing key certificate** SHA-256, not the upload key).
2. Paste it into `public/.well-known/assetlinks.json`, replacing `REPLACE_WITH_YOUR_SHA256_FINGERPRINT`.
3. Publish this project so the file is live at
   https://srlumina.lovable.app/.well-known/assetlinks.json

## 3. Play Console setup

- Create app → name "SR Lumina", type App, Free.
- Upload the `.aab` to Internal testing first, then Production.
- Fill Data safety: the app collects email + study logs, encrypted in transit, deletable on request.
- Add a privacy policy URL (required; a `/privacy` page on the site is enough).
- Target audience: 13+.

## 4. Store assets checklist

| Asset | Spec |
| --- | --- |
| App icon | 512×512 PNG, no transparency (`public/icon-512.png`) |
| Feature graphic | 1024×500 PNG/JPG (`store/feature-graphic.jpg`) |
| Phone screenshots | 2–8, min 1080px on the short side (capture Home, Log, Analytics, Settings) |
| Short description | ≤80 chars |
| Full description | ≤4000 chars |

Short description:
> Track every question you solve daily. Streaks, subject rings, and real progress.

Full description draft:
> SR Lumina is a minimalist daily question tracker for JEE and NEET aspirants. Log the
> questions you solve by subject, chapter, and source (NCERT, PYQs, modules), and watch your
> progress fill in Apple-style subject rings. Build streaks, get a daily motivational reminder,
> and review weekly and monthly analytics that show exactly where your time goes.
>
> • Daily logging by subject, chapter and source
> • Goal rings and streak tracking
> • Weekly and monthly analytics with trends
> • Exam countdown and daily motivation
> • Daily reminder notification at your chosen time

## 5. Notifications

Web Push already works inside the TWA on Android 13+ once the user grants the notification
permission. No extra Play configuration is needed, and no FCM key has to be added to the wrapper.

## Updating the app

Content and feature changes go live by publishing this project — no new Play release needed.
Only bump `appVersionCode`/`appVersionName` and re-upload when the wrapper itself changes.
