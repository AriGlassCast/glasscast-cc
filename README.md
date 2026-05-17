# Glasscast Command Center — Samsung TV Dashboard

## Architecture
```
Samsung QB43C TVs (Custom App)
  → http://192.168.4.50:8080/ (local Mac server via SSSP protocol)
  → Downloads signed .wgt (Samsung certificate required)
  → .wgt redirects to GitHub Pages
  → GitHub Pages serves the dashboard HTML + data.json
```

## Screens
| Screen | TV | GitHub Pages URL | .wgt Source | Cert Profile |
|--------|-----|-----------------|-------------|--------------|
| Screen 1 (Daily OS) | TV 1 | https://ariglasscast.github.io/glasscast-cc/ | ~/GlasscastWgt/ | Screen_1 |
| Screen 2 (Brand) | TV 2 | https://ariglasscast.github.io/glasscast-cc/screen2/ | TBD | TBD |
| Screen 3 (Network Flyover) | TV 3 | https://ariglasscast.github.io/glasscast-cc/screen3/ | ~/GlasscastWgt-Screen3/ | Screen_3 |

## Live Data Feeds (NO API CHARGES — all free)

### Screen 1 — data.json (auto-refreshed every 30 min via Cowork scheduled task)
- **Google Calendar** → calendar events for the week (Cowork connector, free)
- **Gmail** → unread emails from last 3 days (Cowork connector, free)
- **KPIs** → computed from calendar + mail counts
- Dashboard fetches data.json every 15 min with cache-busting param

### Screen 3 — ESPN Sports Crawl (live, no API key)
- **ESPN Public API** → NBA, NHL, MLB, NFL scores + news (free, no key)
- NY team focus: Knicks, Nets, Islanders, Mets, Giants
- Refreshes every 30 min (5 min during game hours 12pm-1am)
- Fetched client-side — no server or charges

## How Updates Work
1. **Dashboard content** (HTML/CSS/JS): Push to this repo → GitHub Pages auto-deploys → TVs load on next refresh
2. **Screen 1 data** (calendar/mail): Cowork scheduled task "refresh-dashboard-data" runs every 30 min, pulls live data, pushes data.json here
3. **Screen 3 scores**: Client-side ESPN fetch — always live, nothing to push
4. **TV .wgt**: NEVER needs updating unless redirect URL changes. Once installed, the TV caches it.

## CRITICAL RULES — DO NOT BREAK
- .wgt files MUST be signed with Samsung certificates (`tizen package -t wgt -s [Profile]`) — NEVER use plain `zip`
- sssp_config.xml size MUST be exact bytes (`wc -c`)
- Version MUST be bumped in BOTH config.xml AND sssp_config.xml for TV to re-download
- config.xml MUST have: `access origin="*"`, `required_version="7.0"`, `profile name="tv"`
- Package ID MUST be exactly 10 characters (GlassCstCC)
- Use redirect (`window.location.href`), NOT iframe
- Samsung certs only (NOT Tizen certs) — one cert profile per TV (each DUID)
- All paths in index.html must be RELATIVE (`./data.json`, `./sw.js`) — NOT absolute (`/data.json`) — because GitHub Pages uses subdirectory `/glasscast-cc/`
- Netlify free tier only allows 1 site — that's why we use GitHub Pages
- NO API charges ever — all data sources must be free

## TV Info
- Model: Samsung QB43C 43" commercial display
- Firmware: S-KSU2EWWC-1150.8
- Tizen: 7.0
- TV 1 DUID: KLCDMLZKLBWNC
- TV 1 IP: 192.168.4.32
- Mac IP: 192.168.4.50

## Build & Deploy
```bash
# Build signed .wgt for Screen 1
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-8.jdk/Contents/Home
cd ~/GlasscastWgt
~/tizen-studio/tools/ide/bin/tizen package -t wgt -s Screen_1 -- .
cp "Glasscast Command Center.wgt" ~/samsung-serve/GlasscastCC.wgt
SIZE=$(wc -c < ~/samsung-serve/GlasscastCC.wgt | tr -d ' ')
# Update sssp_config.xml with exact size and matching version
cd ~/samsung-serve && python3 -m http.server 8080 --bind 0.0.0.0
```

## Samsung Certificates
- Location: /Users/arichasin/SamsungCertificate/
- Screen_1: DUID KLCDMLZKLBWNC
- Screen_3: DUID EXCDMLZKCTSD2
- Launch Certificate Manager: `export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-8.jdk/Contents/Home && open ~/tizen-studio/tools/certificate-manager/Certificate-manager.app`
