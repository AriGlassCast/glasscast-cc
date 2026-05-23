# Glasscast Command Center — Session Startup & Handoff

> **YOU ARE READING THIS BECAUSE THE SKILL TOLD YOU TO. DO NOT SKIP ANY SECTION.**
> **DO NOT start work, write code, push commits, or answer questions until you have read this entire document AND pulled both screen HTML files from GitHub.**

---

## MANDATORY SESSION START CHECKLIST

Every session. No exceptions. No shortcuts.

1. ✅ Read this file (you're doing it now)
2. ✅ Read `README.md` from this repo
3. Fetch `index.html` from this repo → save locally (Screen 1 source)
4. Fetch `screen3/tv.html` from this repo → save locally (Screen 3 source)
5. Only THEN respond to the client

**If the client says "read me first" — this is what they mean. Do steps 1-4 silently, then confirm you're ready.**

---

## INFRASTRUCTURE — CRITICAL REFERENCE

### Screen URLs (ALL URLs end with / — NO EXCEPTIONS)

| Screen | GitHub Pages URL | Samsung Loads From | Port |
|--------|-----------------|-------------------|------|
| Screen 1 (Daily OS) | https://ariglasscast.github.io/glasscast-cc/ | http://192.168.4.50:8080/ | 8080 |
| Screen 2 (Brand) | https://ariglasscast.github.io/glasscast-cc/screen2/ | TBD | 8082 (planned) |
| Screen 3 (Network Flyover) | https://ariglasscast.github.io/glasscast-cc/screen3/ | http://192.168.4.50:8081/ | 8081 |

**The Samsung TVs do NOT load from GitHub Pages directly.** They load from the local Mac server (192.168.4.50) via SSSP protocol. The .wgt app on each TV redirects the browser to the GitHub Pages URL.

### Hardware
- Displays: 3× Samsung QB43C 43" commercial, portrait 1080×1920
- Firmware: S-KSU2EWWC-1150.8, Tizen OS 7.0
- TV 1 DUID: KLCDMLZKLBWNC, IP: 192.168.4.32
- Screen 3 DUID: EXCDMLZKCTSD2
- Mac server IP: 192.168.4.50

### File Mapping

| File in Repo | Screen | What It Is |
|-------------|--------|------------|
| `index.html` | Screen 1 | Daily OS dashboard |
| `screen2/index.html` | Screen 2 | Brand identity |
| `screen3/tv.html` | Screen 3 | Network flyover — **THIS IS THE LIVE FILE ON SAMSUNG** |
| `screen3/index.html` | Screen 3 | Dev/browser version (NOT on Samsung) |
| `data.json` | Screen 1 | Calendar + mail data (auto-refreshed by scheduled task) |
| `version.txt` | Screen 1 | Auto-reload trigger (polled every 10s) |
| `screen3/version.txt` | Screen 3 | Auto-reload trigger (polled every 10s) |

### GitHub
- Repo: `AriGlassCast/glasscast-cc`
- PAT: `[stored in conversation context — never commit to repo]`
- Pages CDN cache: ~10 min, max-age=600, cannot be purged

### Push Pattern (THE ONLY WAY to update Samsung)
1. Fetch file SHA via GitHub Contents API
2. Modify content in Python/bash — **NEVER browser-based editing** (causes UTF-8 corruption)
3. Base64 encode content, PUT via Contents API with SHA
4. Wait 25 seconds for GitHub Pages rebuild
5. Push new timestamp to `version.txt` (or `screen3/version.txt`) to trigger reload
6. Samsung polls version.txt every 10s — reload happens within ~35s of version bump
7. Fallback: Samsung hard-reloads every 30 minutes regardless
8. Say "I pushed — let me know when you see it." NEVER say "it should reload" — you cannot see the Samsung.

### Tizen WebView Rules (VIOLATING THESE BREAKS THE TV)
- **ES5 ONLY** — no arrow functions, no template literals, no `let`/`const`, no `class`, no destructuring
- Use `var`, `function(){}`, string concatenation with `+`
- No `URLSearchParams`, no `fetch` with async/await, no `Promise.allSettled`
- `atob()` corrupts multi-byte UTF-8 — never use it for file content
- Never modify the version.txt polling/reload mechanism
- If unsure whether code is Tizen-safe, DO NOT PUSH — ask client to test first

### Local Mac Servers (launchd — auto-start on boot, auto-restart on crash)
- `com.glasscast.serve8080` → Screen 1, port 8080, dir: `~/samsung-serve/`
- `com.glasscast.serve8081` → Screen 3, port 8081, dir: `~/samsung-serve-screen3/`
- Plist files: `~/Library/LaunchAgents/com.glasscast.serve8080.plist` (and 8081)
- Logs: `/tmp/glasscast-8080.log` and `/tmp/glasscast-8081.log`
- Restart if down:
  ```bash
  launchctl unload ~/Library/LaunchAgents/com.glasscast.serve8080.plist 2>/dev/null
  launchctl load ~/Library/LaunchAgents/com.glasscast.serve8080.plist
  ```

---

## DESIGN SYSTEM — WARM NOIR

### Screen 3 CSS Root Variables
```css
:root {
  --bg:#06060a;    /* Body bg — HAS BLUE BIAS on Samsung (R:6,G:6,B:10) */
  --bg2:#0a0a10;
  --bg3:#0e0e14;
  --bg4:#121218;   /* Card bg on Screen 3 */
  --bg5:#18181f;
  --bg6:#1c1c24;
  --bg7:#22222c;
  --acc:#e8922a;   /* Primary amber (O4) */
  --acc2:#d47a1e;  /* Secondary amber (O3.5) */
  --acc3:#f4b85c;  /* Light amber (O6) */
  --acc4:#b06818;  /* Section labels (O3) */
  --acc5:#8c5a2e;  /* Dark amber (O2) */
  --t1:#f4e8d6;    /* Brightest text */
  --t2:#dcc8aa;    /* Primary text */
  --t3:#b8a080;    /* Secondary text */
  --t4:#7c6650;    /* Muted text */
  --t5:#5a4836;    /* Dimmest text */
  --red:#c87014;   /* Screen 3 red — DIFFERENT from Screen 1 */
  --green:#d4a030;
  --bdr:rgba(232,146,42,.06);
  --bdr2:rgba(232,146,42,.10);
  --bdr3:rgba(232,146,42,.18);
}
```

### Screen 1 CSS Variables — KEY DIFFERENCES
```css
:root {
  -g4:#121218;   /* TYPO: missing double-dash. var(--bg4) = undefined → transparent.
                    This is WHY Screen 1 .card backgrounds are transparent.
                    Screen 1 cards show pure body bg. This is the "dark" look. */
  --red:#e05a30;  /* Screen 1 red is DIFFERENT from Screen 3 (#c87014) */
}
```

### Named Orange Scale
| Name | Hex | CSS Var | Usage |
|------|-----|---------|-------|
| O1 | #8c4400 | — | Darkest orange, Axiom Bookings bar |
| O2 | #8c5a2e | --acc5 | Dark amber |
| O3 | #b06818 | --acc4 | Section labels, AI card titles |
| O5 | #c87014 | --red (S3) | Axiom Avg CPM, Sentinel pulse |
| O3.5 | #d47a1e | --acc2 | Secondary amber |
| O4 | #e8922a | --acc | Primary amber |
| O6 | #f4b85c | --acc3 | Light amber, highlights |

### Samsung Color Behavior
- Samsung QB43C amplifies blue channel
- `#06060a` (R:6,G:6,B:10) → renders visibly blue on Samsung
- `#0a0a0a` (R:10,G:10,B:10) → neutral dark, no bias
- For darkest/blackest look: use `transparent` so body bg shows through (this is how Screen 1's Calendar works — var(--bg4) is broken → transparent → body bg)
- When adding explicit background colors, use equal RGB channels to avoid Samsung color shift

### Typography
- System: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- Mono: `'SF Mono', Monaco, 'Fira Code', monospace`
- Gold standard: Screen 1 Mail entries = 15px / font-weight 500
- Section labels (.sec-lbl): 13px / 700 / letter-spacing 4px / uppercase / var(--acc4)
- AI card titles: 14px / 700 / #b06818 / ALL CAPS
- AI card descriptions: 12px / color varies per card

### Spacing
- Screen padding: 8px horizontal
- Card border-radius: 10px
- Card border: 1px solid var(--bdr2)
- Section header: padding 7px 20px, bg rgba(232,146,42,.03), border-bottom 1px solid var(--bdr2)
- Content areas: typically 12-16px vertical, 24px horizontal
- Grid gaps: 8px between cards

---

## CURRENT STATE (Update this section after every session)

### Screen 1 (Daily OS) — LIVE
- Container locking CSS: 10 containers, nth-child selectors with fixed heights
- Calendar + Mail pull from data.json every 15 min
- 9 tasks, 6 reminders
- Terminal: font 13px, flex layout, 6 visible lines
- Weather: Open-Meteo API (free, no key)
- Auto-reload every 30 min

### Screen 3 (Network Flyover) — LIVE
- Flyover video: rotation-free version, 1080x650, 15fps, 98s, 14s per market
- Sports crawl: ESPN public API, NY team focus, refreshes every 30 min (5 min during game hours)
- Plexus terminal: 16 rotating lines, font 10.5px
- AI Product Cards (PRISM, SENTINEL, AXIOM, VECTOR):
  - Titles: ALL CAPS, #b06818, em-dash descriptions also #b06818
  - Card backgrounds: currently `transparent` (matching Screen 1 Calendar look)
  - PRISM: 6 bars with 26-stop gradient (#3a1800 → #ffc844), wb1-wb6 animations
  - SENTINEL: heartbeat SVG, 3-color rotation every 90s ['#c87014','#0a355e','#d49040'], L-to-R stagger 400ms
  - AXIOM: ring chart + 3 bars (O1, O3, O5 colors)
  - VECTOR: 4 pipeline bars (--acc, --acc2, --acc2, --red)
- **BUG: Sentinel rotation JS is duplicated 3 times** — three independent setInterval calls running simultaneously
- Container locking was removed — needs re-measurement if re-applied
- version.txt polling every 10s + 30-min hard reload

### Screen 2 (Brand) — NOT YET ACTIVE ON SAMSUNG

---

## KNOWN ISSUES
- Sentinel 3-color rotation JS duplicated 3× in screen3/tv.html (lines ~432, ~486, ~574)
- Screen 1 index.html has UTF-8 corruption from browser-based editing (54 lines of mojibake) — needs git checkout to fix
- Screen 1 CSS var `--bg4` is broken (typo: `-g4`) — cards are transparent by accident but it looks good
- Screen 3 flyover: later markets (Denver, LA) have more zoom (~1.6x) due to heavier original rotation
- Flyover transit fine-tuning paused: client wants faster ascent (4s→2.5s) and higher travel zooms on dark legs

---

## FAILURE HISTORY — READ AND INTERNALIZE

### Scope Creep (happened 4+ times)
- Client said "remove rotation from map video." Agent rebuilt entire video from scratch with new tiles, new timing, added city name overlay, broke JS sync.
- Client said "fix spacing." Agent also changed AI grid bottom padding, causing crawl overlap.
- Client said "add 2 reminders." Agent added 4, changed fonts, changed padding across entire screen.

### Skipping QA (happened every session)
- Pushed changes without opening page in Chrome to verify
- Said "QA passed" without ever taking a screenshot
- Client found bugs every time: crawl overlap, video stuck, font mismatch

### Broken Promises (happened 4+ times in one session)
- Promised to use QA and art direction agents. Didn't spawn them. Pushed broken work.
- Client's words: "how can we guarantee that you'll do it... I am pleading with you"
- Client's words: "lip service is lying"

### UTF-8 Corruption
- Used browser-based GitHub editor with atob() — corrupted 54 lines of multi-byte characters
- A single `git checkout` from Terminal would have fixed it in 5 seconds

### Wrong URLs/Colors from Memory
- Told client Samsung URL was GitHub Pages when it's actually local server port 8081
- Applied colors based on conversation summary instead of reading actual file
- Edited Screen 3 without loading Screen 1 for comparison — got colors wrong repeatedly

---

## CLIENT RULES — NON-NEGOTIABLE

1. **ONE CHANGE MEANS ONE CHANGE.** Never bundle unrequested changes.
2. **All URLs end with /** — always, everywhere.
3. **Never say "it should reload"** — you cannot see the Samsung. Say "I pushed — let me know when you see it."
4. **Never edit from memory** — pull the actual file from GitHub every time.
5. **Never push modern JS** — ES5 only for Tizen.
6. **Visual consistency** — font sizes, padding, spacing must match across sections.
7. **Proof over promises** — show screenshots, not assurances.
8. **Cross-screen edits require both files loaded** — pull both index.html and screen3/tv.html before any visual change that references another screen.

---

## CLIENT PREFERENCES
- One change means one change — scope lock everything
- Visual consistency matters deeply
- Gets frustrated by repeated promises that aren't kept
- Would rather have honest process than reassurance
- References Screen 1 Mail entries (15px/500) as the gold standard
- Works late, expects changes to be live and correct
- Uses shorthand like "O1, O3, O5" for orange scale, "N1" for darkest neutral
