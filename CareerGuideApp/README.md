# CareerGuide India — Android App 📱🧭

A **fully offline** Android app version of CareerGuide India. The whole game
(Character Stats → Story Quest → Like or Skip → Choose Your Path) and the
recommendation engine run entirely inside the app — **no internet connection,
no server, no login required.** It's the same experience as the web app,
wrapped in a WebView so it installs and runs like any other Android app.

---

## You don't have Android Studio — here's how to get a real .apk file anyway

You don't need to install anything on your computer. GitHub will build the
APK for you for free, using the exact project in this folder. Takes about
10 minutes, mostly waiting.

### Step-by-step (no coding, no command line)

1. **Create a free GitHub account** at [github.com/join](https://github.com/join)
   if you don't already have one.

2. **Create a new repository:**
   - Click the **+** icon (top right) → **New repository**
   - Name it anything, e.g. `careerguide-android`
   - Keep it **Public** (required for free Actions minutes on personal accounts)
   - Click **Create repository**

3. **Upload this entire `CareerGuideApp` folder's contents:**
   - On your new repo's page, click **"uploading an existing file"**
   - Drag and drop **everything inside** the `CareerGuideApp` folder
     (not the folder itself — its *contents*: `app/`, `gradle/`,
     `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`, and the
     `.github` folder)
   - ⚠️ GitHub's web uploader sometimes hides folders that start with a dot.
     If `.github/workflows/build-apk.yml` doesn't appear to upload, create it
     manually: click **Add file → Create new file**, type
     `.github/workflows/build-apk.yml` as the file name (the slashes
     auto-create the folders), and paste in the contents of that file from
     this project.
   - Scroll down, click **Commit changes**

4. **Watch it build automatically:**
   - Click the **Actions** tab at the top of your repository
   - You'll see a workflow run called **"Build CareerGuide APK"** — click it
   - Wait for the green checkmark (2–5 minutes)

5. **Download your APK:**
   - On that same run's page, scroll down to **Artifacts**
   - Click **CareerGuideIndia-debug-apk** to download a zip
   - Unzip it — inside is `app-debug.apk`, your ready-to-install app

6. **Install it on an Android phone:**
   - Transfer `app-debug.apk` to your phone (email it to yourself, WhatsApp,
     Google Drive, or a USB cable)
   - Tap the file on your phone. Android will ask to allow installs from this
     source the first time — allow it, then tap **Install**
   - Open **CareerGuide India** from your app drawer — it works with your
     phone in **Airplane Mode**, proving it's fully offline (great thing to
     demo to judges!)

That's it — you now have a real, installable, offline Android app with no
Android Studio, no SDK, and no local build tools.

---

## If you *do* get Android Studio later

This is a completely standard Android Studio project. Just:
1. Open Android Studio → **Open** → select the `CareerGuideApp` folder
2. Let it sync (downloads Gradle/SDK bits automatically, needs internet once)
3. Click the green **Run ▶** button with a phone/emulator connected, or
   **Build → Build Bundle(s) / APK(s) → Build APK(s)** to get the file directly

---

## What's inside

```
CareerGuideApp/
├── .github/workflows/build-apk.yml   # Free CI pipeline that builds the APK
├── app/
│   ├── build.gradle.kts              # App module config
│   ├── src/main/
│   │   ├── AndroidManifest.xml       # No INTERNET permission — offline by design
│   │   ├── java/com/careerguide/app/
│   │   │   └── MainActivity.kt       # Loads the WebView pointed at assets/www
│   │   ├── res/                      # App icon, colors, theme
│   │   └── assets/www/               # The entire offline web app lives here
│   │       ├── index.html
│   │       ├── assessment.html       # The Crossroads Quest game
│   │       ├── results.html
│   │       ├── css/style.css
│   │       └── js/
│   │           ├── career_engine.js  # JS port of the Python recommendation engine
│   │           ├── game.js           # Story quest, swipe cards, duel round
│   │           └── main.js           # Renders the results report
├── build.gradle.kts / settings.gradle.kts / gradle.properties
```

### Why a WebView app instead of "fully native"?

For a school expo, this is the right trade-off: you get a real installable
`.apk`, a real app icon, a real launcher entry, and it demonstrably works with
zero internet — while re-using (not duplicating) all the design and game
logic you already built and tested on the web. `career_engine.js` is a
line-by-line port of `career_engine.py`, so both versions always agree.

### How the offline scoring works (for your viva)

- `career_engine.js` is loaded first, `game.js` second.
- As the student plays the quest, `game.js` accumulates points per interest
  tag in memory.
- On the final screen, `game.js` calls
  `CareerGuidanceEngine.getRecommendations(payload)` **directly in the same
  JavaScript context** — no network call, no server. This is the key fact
  that makes the app airplane-mode-proof.
- The result JSON is stored in `sessionStorage` and read by `results.html`.

### A couple of honest limitations to mention if asked

- **Fonts:** the CSS references Google Fonts by URL. With no internet
  permission, the WebView simply can't fetch them, so the app falls back to
  the phone's default system font — everything still looks clean, just not
  the exact custom typeface from the web demo. (Bundling the font files
  locally is a natural "future work" point if a judge asks.)
- **This is a debug build**, meant for installing and demoing directly. A
  Play Store submission would need a signed release build — worth mentioning
  if asked, not something you need for an expo demo.

---

## Regenerating the launcher icon (optional)

The app icon (a three-way compass mark, matching the web logo) was generated
with `generate_icons.py` using Pillow. If you want to tweak the colors, edit
the color constants at the top of that script and re-run it — it writes PNGs
straight into `app/src/main/res/mipmap-*/`.
