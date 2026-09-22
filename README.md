# LinguaRoute — interface

The interface for LinguaRoute, a system that routes learner leads to the Business
Development associate who **actually speaks their language**.

When a Tamil-speaking learner is called by a Hindi-only BD, the call is dead
before it starts. This app makes that visible: it shows which language each
learner speaks and how confident we are, explains every routing decision, gives
each BD a queue they can genuinely work, and counts what the whole thing saves.

React + Vite + Tailwind, deployed as a static site on Vercel. The API is a
separate repository and a separate deployment.

---

## Running it locally

Needs Node 18+ and the API running on `http://localhost:4000`.

```bash
cp .env.example .env     # leave VITE_API_URL blank for local development
npm install
npm run dev              # http://localhost:5173
```

With `VITE_API_URL` blank the app calls a relative `/api` path, and the Vite dev
server proxies it to `localhost:4000` (see `vite.config.js`). Nothing else needs
configuring.

## The six-click demo

1. **Overview.** 74 leads, ~69% matched, **7 nobody can call** — and a
   coverage-gap note naming Bengali and Odia. That gap is deliberate: the seeded
   BD roster has no Bengali or Odia speaker.
2. **Leads → "Why?" on a Kannada learner.** The best BD scores 98 with the
   reasoning itemised; the Hindi-only BDs are ruled out as *No shared language*.
   Open a Bengali learner instead and *every* BD is ruled out — that is the gap,
   visible per lead.
3. **Run routing.** The waiting leads get matched; the Bengali and Odia ones stay
   put and the note says exactly why.
4. **Switch role (top right) to a BD.** The whole app becomes their queue: only
   learners they can actually speak to, each row leading with *"Open the call in
   Malayalam."* Inferred languages carry a warning to confirm on the call.
5. **Log a call → Language barrier.** The lead leaves the queue and goes back in
   the pool; the barrier rate on the Overview moves.
6. **Impact.** The measured barrier rate over time, demand vs. BD coverage per
   language, load spread across the team, and the estimated wasted calls avoided
   — labelled as an estimate, next to the measured number, so the two are never
   confused.

Then: **Team → Add BD** with Bengali, re-run routing, and watch the coverage gap
close.

`public/sample-leads.csv` exercises the **Import** page: it includes a row with
no name and a row claiming to speak Klingon, both reported per row without
failing the batch.

## Layout

```
vercel.json                 SPA fallback so deep links survive a refresh
public/sample-leads.csv     messy fixture for demoing the importer
src/
├─ api.js                   fetch wrapper; API origin from VITE_API_URL
├─ index.css                the whole design system: ink scale, one accent, red
├─ components/Layout.jsx    top bar, navigation, role switcher, theme toggle
├─ components/charts.jsx    Recharts, one measure per plot, table-view twins
├─ components/ui.jsx        page/section headers, stats, language + source text
├─ context/RoleContext.jsx  the Admin / BD switcher
├─ lib/useAsync.js          fetch-on-mount that dims rather than flashing a skeleton
└─ pages/                   Dashboard, Leads, MyQueue, Import, Analytics, Team
```

## A note on the interface

Structure is carried by type, space and hairline rules rather than by boxes, and
the palette is three things: a neutral ink scale, one accent, and red. The accent
appears only where data lives — chart marks, meters, links. Red is reserved for
the single thing this product exists to surface: a learner nobody on the team can
speak to. Because nothing else is coloured, colour always means something. Red is
also never alone — it is always paired with a word ("no BD", "Language barrier",
"No shared language"), so the meaning survives for a colourblind reader, in
print, and in forced-colours mode.

Chart colours come from a validated palette and were checked against these exact
surfaces in both light and dark. Every chart has a table-view twin, so no value
is reachable by hover alone.

Dark mode is a selected set of steps rather than an automatic flip, and is
declared twice in `index.css`: once for the OS setting, once for the in-app
toggle, so the toggle wins in both directions.

## Deploying to Vercel

| Setting | Value |
|---|---|
| Root Directory | repository root (this folder) |
| Framework preset | Vite (detected) |
| Environment variables | `VITE_API_URL=https://<your-api>.vercel.app` |

Deploy the **API first** — `VITE_API_URL` is read at **build time** and inlined
into the bundle, so pointing it somewhere new needs a redeploy, not just a
restart. No trailing slash.

`vercel.json` adds the SPA fallback, so `/leads`, `/impact` and friends survive a
hard refresh instead of 404ing.

Once this app has a URL, set `CORS_ORIGIN` on the **API** project to it and
redeploy the API — otherwise the browser will block every request.

## Honest limits

- **There is no authentication.** The role switcher is a demo affordance so one
  browser can show both sides of the product; it sends an `x-role` header that
  the API trusts. A real deployment replaces it with a session.
- **Anything in a `VITE_*` variable ships to the browser.** `VITE_API_URL` is a
  public URL, which is fine — but never put a secret in one.
- The bundle is a single chunk of roughly 600 kB (180 kB gzipped), most of it
  Recharts. Code-splitting the charts route would be the first optimisation if
  it matters.
