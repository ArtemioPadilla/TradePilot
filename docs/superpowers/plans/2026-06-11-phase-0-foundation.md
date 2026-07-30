# Phase 0: Foundation — TradePilot Web Rebuild on Inceptor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `web/` with a TradePilot-branded instance of the Inceptor template, deployed green to GitHub Pages at `/TradePilot/`, with IDD agents and CI/CD adapted to the monorepo.

**Architecture:** Template-first rebuild (approved spec: `docs/superpowers/specs/2026-06-11-web-rebuild-inceptor-design.md`). Full copy of Inceptor (all ~44 UI components + gallery + docs + demos) into `web/`; identity lives in `src/lib/site-meta.ts` + env vars (Inceptor is built for re-instantiation). Old app preserved via git tag. Firebase workflows removed now; remaining Firebase root files cleaned up in Phase 1.

**Tech Stack:** Astro 5, React 19, Tailwind v4, Base UI, TanStack, `@vite-pwa/astro`, Playwright, Vitest, GitHub Actions → GitHub Pages.

**Source template:** `/Users/artemiopadilla/Documents/repos/GitHub/personal/issue-driven-web-template` (referred to as `$INCEPTOR` below).

**Key facts discovered (do not re-derive):**
- Inceptor parameterizes base path via `ASTRO_BASE` env (set in `deploy.yml`), repo via `PUBLIC_REPO_SLUG`, identity via `src/lib/site-meta.ts` (marked "RE-BRAND ON INSTANTIATION").
- TradePilot deploys at `site: 'https://artemiop.com'`, base `/TradePilot/`.
- TradePilot root workflows to be replaced: `deploy-web.yml`, `test.yml`, `lighthouse.yml`, `deploy-firestore.yml`. Kept: `codeql.yml`, `security.yml`, `docs.yml`.
- Inceptor's `npm run check` = `check:astro` + `type-check` + `test` (vitest) in parallel, then `build` (includes pagefind). Its CI has `server-node` / `server-flask` jobs we drop (backends excluded).
- Inceptor brand hue is emerald (oklch hue 163); TradePilot is blue (`#3b82f6` family, oklch hue ~260).
- Old TradePilot icons live at `web/public/favicon.png`, `web/public/favicon.svg`, `web/public/icons/` — recoverable from the safety tag.

---

### Task 1: Safety tag + remove old web app and stale workflows

**Files:**
- Delete: `web/` (entire directory)
- Delete: `.github/workflows/deploy-web.yml`, `.github/workflows/test.yml`, `.github/workflows/lighthouse.yml`, `.github/workflows/deploy-firestore.yml`

- [ ] **Step 1: Verify clean tree and tag the pre-rebuild state**

```bash
git status --porcelain   # must be empty; stop if not
git tag pre-inceptor-rebuild
git push origin pre-inceptor-rebuild
```

- [ ] **Step 2: Remove old web app and replaced workflows**

```bash
git rm -r --quiet web
git rm .github/workflows/deploy-web.yml .github/workflows/test.yml \
       .github/workflows/lighthouse.yml .github/workflows/deploy-firestore.yml
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(web)!: remove Firebase-era web app (preserved at tag pre-inceptor-rebuild)"
```

Note: between this commit and Task 7, pushes to `main` would deploy nothing. Do all of Phase 0 on a branch:

```bash
git checkout -b phase-0/foundation
```

(Do Step 1–3 on this branch from the start.)

---

### Task 2: Copy Inceptor into web/ and verify it runs

**Files:**
- Create: `web/` (full template copy)

- [ ] **Step 1: Copy the template, excluding template-local artifacts**

```bash
INCEPTOR=/Users/artemiopadilla/Documents/repos/GitHub/personal/issue-driven-web-template
rsync -a "$INCEPTOR/" web/ \
  --exclude .git --exclude node_modules --exclude dist --exclude test-results \
  --exclude server-node --exclude server-flask --exclude docker-compose.yml \
  --exclude INTEGRATION-PLAN.md --exclude names.md --exclude image002.png \
  --exclude firebase-debug.log --exclude .env
```

`server-*` is excluded per spec (Supabase replaces any backend need). `INTEGRATION-PLAN.md` is Inceptor's historical record, not ours.

- [ ] **Step 2: Remove Inceptor's agent copies from web/ (they move to repo root in Task 6)**

```bash
rm -rf web/.claude
```

- [ ] **Step 3: Install and run the full check**

```bash
cd web && npm install && npm run check
```

Expected: PASS (typecheck + vitest + build all green — the template ships green).
If `pagefind` fails on first build, re-run `npm run build` once (it indexes `dist/`).

- [ ] **Step 4: Commit**

```bash
git add -A web
git commit -m "feat(web): instantiate Inceptor template as new web app base"
```

---

### Task 3: Identity rebrand (site-meta, env, header/footer, manifest, landing)

**Files:**
- Modify: `web/src/lib/site-meta.ts`
- Modify: `web/.env.example`
- Modify: `web/astro.config.mjs`
- Modify: `web/src/components/common/SiteHeader.astro`, `web/src/components/common/SiteFooter.astro`
- Modify: `web/src/pages/index.astro` (hero copy)
- Modify: any vitest test asserting the "Inceptor" identity

- [ ] **Step 1: Find identity assertions in tests and update them to expect TradePilot**

```bash
cd web && grep -rln "Inceptor\|inceptor" src/tests/
```

In each hit, change expected strings: `Inceptor` → `TradePilot`, `ArtemioPadilla/inceptor` → `ArtemioPadilla/TradePilot`. Only touch *expectations about site identity* (e.g. `agent-readable.test.ts` checking llms.txt/SITE name); leave tests about template mechanics unchanged.

- [ ] **Step 2: Run those tests to verify they now fail**

```bash
npx vitest run src/tests/agent-readable.test.ts
```

Expected: FAIL (source still says Inceptor).

- [ ] **Step 3: Rebrand `site-meta.ts`**

```ts
export const SITE = {
  name: 'TradePilot',
  description:
    'Algorithmic trading workbench: backtest strategies in your browser — ' +
    'momentum, mean reversion, smart beta — with portfolio optimization, ' +
    'a Backtest Lab, and community leaderboards. Astro 5 + React 19 islands.',
  repoSlug: (import.meta.env.PUBLIC_REPO_SLUG as string | undefined) ?? 'ArtemioPadilla/TradePilot',
  license: 'MIT',
  programmingLanguages: ['TypeScript', 'Astro', 'CSS', 'Python'],
} as const;
```

- [ ] **Step 4: Update `.env.example` repo wiring and flags**

```bash
# in web/.env.example
PUBLIC_REPO_SLUG=ArtemioPadilla/TradePilot
PUBLIC_FLAG_BLOG=false        # hide template blog until Phase 6 curates content
```

- [ ] **Step 5: Update PWA manifest + drop template redirects in `astro.config.mjs`**

In the `AstroPWA` manifest block:

```js
manifest: {
  name: 'TradePilot',
  short_name: 'TradePilot',
  description: 'Backtest trading strategies in your browser — portfolio optimization, Backtest Lab, leaderboards.',
  theme_color: '#2563eb',
  background_color: '#0a0a0a',
  // display/start_url/scope/icons: unchanged
```

Delete the `redirects: { '/dashboard': ..., '/data': ..., '/data/large': ..., '/showcase': ... }` block entirely (those map old *Inceptor* URLs; TradePilot has no legacy template URLs).

- [ ] **Step 6: Rebrand header/footer**

`SiteHeader.astro`: `aria-label="TradePilot — home"`, visible brand `<span>` → `TradePilot`, GitHub link → `https://github.com/ArtemioPadilla/TradePilot`. Apply the same string swaps in `SiteFooter.astro` (grep for `inceptor` / `Inceptor` in both files; replace every hit).

- [ ] **Step 7: Rebrand the landing hero (`src/pages/index.astro`)**

Replace the hero headline/subtitle/CTA copy (keep the section structure and components as-is):

- Headline: `Backtest like a pilot.`
- Subtitle: `TradePilot runs momentum, mean-reversion, and smart-beta strategies entirely in your browser — portfolio optimization, real metrics, zero backend.`
- Primary CTA: `Open the app` → link `href('dashboard')`; secondary CTA: `View on GitHub` → repo URL.

Deeper landing redesign is NOT Phase 0 scope — copy swap only.

- [ ] **Step 8: Run the full test suite**

```bash
npm run test
```

Expected: PASS. If a test still asserts `inceptor` somewhere, repeat Step 1's grep for the failing string and update expectation or source consistently (source of truth = TradePilot identity).

- [ ] **Step 9: Commit**

```bash
git add -A web && git commit -m "feat(web): rebrand template identity to TradePilot"
```

---

### Task 4: Theme tokens — emerald → TradePilot blue

**Files:**
- Modify: `web/src/styles/global.css`

- [ ] **Step 1: Replace the brand tokens (light mode block, ~lines 42–56)**

```css
/* Brand: TradePilot blue (deep enough for white text) */
--primary: oklch(0.546 0.215 262.9);            /* ~#2563eb */
--primary-foreground: oklch(0.99 0 0);
--accent: oklch(0.96 0.02 262.9);
--accent-foreground: oklch(0.3 0.06 262.9);
--ring: oklch(0.623 0.188 259.8);               /* ~#3b82f6 */
```

- [ ] **Step 2: Sweep remaining emerald-hue tokens (dark mode block + any chart vars)**

```bash
grep -n "163" web/src/styles/global.css
```

For every `oklch(L C 163)` hit, keep `L` and `C`, change hue `163` → `262.9`. (Same brand lightness/chroma, blue hue.)

- [ ] **Step 3: Verify contrast + visual tests locally**

```bash
cd web && npx vitest run src/tests/ux-contrast.test.ts && npm run build
```

Expected: PASS (the contrast test guards the white-on-primary ratio; `0.546` lightness keeps ≥4.5:1 like the emerald it replaces).

- [ ] **Step 4: Commit**

```bash
git add web/src/styles/global.css && git commit -m "feat(web): TradePilot blue brand tokens"
```

---

### Task 5: Favicons + PWA icons from the old app

**Files:**
- Modify: `web/public/favicon.svg`, `web/public/favicon.ico`, `web/public/icons/pwa-192.png`, `web/public/icons/pwa-512.png`, `web/public/icons/pwa-maskable-512.png`, `web/public/apple-touch-icon.png`, `web/public/og-image.png`

- [ ] **Step 1: Recover the old TradePilot logo assets from the safety tag**

```bash
git show pre-inceptor-rebuild:web/public/favicon.svg > web/public/favicon.svg
git show pre-inceptor-rebuild:web/public/favicon.png > /tmp/tp-favicon.png
mkdir -p /tmp/old-icons
git archive pre-inceptor-rebuild web/public/icons 2>/dev/null | tar -x -C /tmp/old-icons --strip-components=2 || true
ls /tmp/old-icons
```

- [ ] **Step 2: Produce the PWA icon set**

If `/tmp/old-icons` already contains 192/512 PNGs, copy them over the template's `web/public/icons/pwa-*.png` (keep the template's filenames — the manifest references them). Otherwise generate from the recovered favicon:

```bash
# macOS has sips built in
sips -z 192 192 /tmp/tp-favicon.png --out web/public/icons/pwa-192.png
sips -z 512 512 /tmp/tp-favicon.png --out web/public/icons/pwa-512.png
cp web/public/icons/pwa-512.png web/public/icons/pwa-maskable-512.png
sips -z 180 180 /tmp/tp-favicon.png --out web/public/apple-touch-icon.png
```

- [ ] **Step 3: Regenerate the OG image with Inceptor's script**

```bash
cd web && node scripts/generate-og.mjs
```

(The script renders from `site-meta.ts`, already rebranded in Task 3.) If it errors on a hardcoded template asset, skip — OG image polish is not a Phase 0 gate; log a follow-up issue instead.

- [ ] **Step 4: Verify PWA config test and commit**

```bash
npx vitest run src/tests/pwa-config.test.ts
git add web/public && git commit -m "feat(web): TradePilot favicons and PWA icons"
```

---

### Task 6: IDD agents at repo root

**Files:**
- Create: `.claude/agents/prometeo.md`, `.claude/agents/forja.md`, `.claude/agents/centinela.md` (repo root)

- [ ] **Step 1: Copy the agents from the template**

```bash
INCEPTOR=/Users/artemiopadilla/Documents/repos/GitHub/personal/issue-driven-web-template
mkdir -p .claude/agents
cp "$INCEPTOR"/.claude/agents/{prometeo,forja,centinela}.md .claude/agents/
```

- [ ] **Step 2: Adapt each agent's context (edit all three files)**

Apply these replacements consistently:

| Template reference | TradePilot replacement |
|---|---|
| "the Inceptor integration of this Astro + React UI template" | "the TradePilot web rebuild (Astro + React app in `web/`, Python engine in `tradepilot/`)" |
| `INTEGRATION-PLAN.md` | `docs/superpowers/specs/2026-06-11-web-rebuild-inceptor-design.md` (phases table) |
| Phase references `Fase 0 … Fase 7` | `Fase 0 … Fase 6` per the spec |
| Any `npm`/`npx` cwd assumption | commands run from `web/` |

Add one line to each agent's context section: `Domain: algorithmic trading — the TS engine lives in web/src/lib/engine/ and must stay pure (no I/O); persistence goes through web/src/lib/data/ contracts.`

- [ ] **Step 3: Commit**

```bash
git add .claude/agents && git commit -m "feat: adapt Inceptor IDD agents (prometeo/forja/centinela) to TradePilot"
```

---

### Task 7: GitHub workflows adapted to the monorepo

**Files:**
- Create: `.github/workflows/web-ci.yml` (from `$INCEPTOR/.github/workflows/ci.yml`)
- Create: `.github/workflows/web-deploy.yml` (from `deploy.yml`)
- Create: `.github/workflows/web-visual.yml` (from `visual.yml`)
- Skip: Inceptor's `claude.yml` and `cd.yml` for now (need `ANTHROPIC_API_KEY` secret decisions — file a follow-up issue)

- [ ] **Step 1: Copy and adapt CI**

```bash
cp "$INCEPTOR"/.github/workflows/ci.yml .github/workflows/web-ci.yml
```

Edits to `web-ci.yml`:
1. `name: Web CI`
2. Delete the `server-node` and `server-flask` jobs entirely.
3. In the `build` job, scope to the web app:

```yaml
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10 # v6
      - uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json
      - run: npm ci
      - run: npm run check
```

4. Add path filters so Python-only commits skip web CI:

```yaml
on:
  push:
    branches: [main, 'phase-*/**', 'feat/**', 'fix/**', 'docs/**', 'chore/**']
    paths: ['web/**', '.github/workflows/web-*.yml']
  pull_request:
    branches: [main]
    paths: ['web/**', '.github/workflows/web-*.yml']
```

- [ ] **Step 2: Copy and adapt deploy**

```bash
cp "$INCEPTOR"/.github/workflows/deploy.yml .github/workflows/web-deploy.yml
```

Edits: same `working-directory: web` + `cache-dependency-path: web/package-lock.json` pattern;
`ASTRO_BASE: ${{ secrets.ASTRO_BASE || '/TradePilot' }}`;
upload artifact `path: ./web/dist`.

- [ ] **Step 3: Copy and adapt visual tests**

```bash
cp "$INCEPTOR"/.github/workflows/visual.yml .github/workflows/web-visual.yml
```

Same monorepo edits (working-directory, cache path, any artifact paths get `web/` prefix). Keep its Playwright browser-install and baseline steps as-is.

- [ ] **Step 4: Validate workflow syntax and commit**

```bash
npx --yes @action-validator/cli .github/workflows/web-ci.yml || true   # best-effort lint
git add .github/workflows && git commit -m "ci: web CI/deploy/visual workflows adapted from Inceptor (monorepo paths)"
```

---

### Task 8: CLAUDE.md updates

**Files:**
- Modify: `web/CLAUDE.md` (came from the template)
- Modify: `CLAUDE.md` (repo root — Web Application section)

- [ ] **Step 1: Adapt `web/CLAUDE.md` header sections**

Keep the stack table, file organization, warnings, and command sections (they're accurate for the copied template). Replace:
- "Repository purpose" → TradePilot web app purpose (browser backtesting workbench; phases tracked in the spec).
- "Active integration" → point to `docs/superpowers/specs/2026-06-11-web-rebuild-inceptor-design.md` as the live plan; note Phase 0 = this foundation.

- [ ] **Step 2: Verify the CLAUDE.md guard test still passes**

```bash
cd web && npx vitest run src/tests/claude-md.test.ts
```

Expected: PASS (it checks structure, not branding — if it asserts specific strings you changed, update expectations to match the new text).

- [ ] **Step 3: Update root `CLAUDE.md`**

In the "Web Application" section: framework list now reads `Astro 5 + React 19 islands (Inceptor template), Tailwind v4, Base UI, TanStack; Auth/DB: Supabase (Phase 1 — not yet wired); Testing: Vitest + Playwright (visual + a11y)`. Update the "Web Commands" block: `npm run check`, `npm run test:visual`, `npm run a11y` (replacing the stale Firebase-era commands). Leave the Python and CyberEco sections untouched.

- [ ] **Step 4: Commit**

```bash
git add web/CLAUDE.md CLAUDE.md && git commit -m "docs: CLAUDE.md reflects Inceptor-based web app"
```

---

### Task 9: Full local verification

- [ ] **Step 1: Full check from clean state**

```bash
cd web && rm -rf dist && npm run check
```

Expected: PASS end-to-end (typecheck, vitest suite, build + pagefind).

- [ ] **Step 2: Base-path build + smoke**

```bash
ASTRO_BASE=/TradePilot npm run build
npx serve dist -l 4322 &   # serve the built site
curl -s http://localhost:4322/TradePilot/ | grep -o "TradePilot" | head -1
kill %1
```

Expected: `TradePilot` (page renders under the base path, branded).

- [ ] **Step 3: E2E + a11y (CLAUDE.md critical gate)**

```bash
npm run test:visual   # full Playwright suite, includes a11y spec
```

Expected: PASS. Visual baselines were captured on Inceptor branding — for snapshot diffs caused by the blue rebrand, regenerate baselines:

```bash
npm run test:visual:update && npm run test:visual
```

Commit regenerated baselines if any.

- [ ] **Step 4: Commit any baseline updates**

```bash
git add -A && git commit -m "test(web): regenerate visual baselines for TradePilot branding" || echo "nothing to commit"
```

---

### Task 10: PR, deploy, live verification

- [ ] **Step 1: Push the branch and open the PR**

```bash
git push -u origin phase-0/foundation
gh pr create --title "feat(web): Phase 0 — rebuild web on Inceptor template" \
  --body "Implements Phase 0 of docs/superpowers/specs/2026-06-11-web-rebuild-inceptor-design.md: template instantiation, TradePilot branding, monorepo CI/CD, IDD agents. Old app preserved at tag pre-inceptor-rebuild.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 2: Watch CI on the PR**

```bash
gh pr checks --watch
```

Expected: `Web CI` green (the old `test.yml`/`lighthouse.yml` checks no longer exist; if branch protection still *requires* them, update required checks in repo settings to `Web CI`).

- [ ] **Step 3: Merge and watch deploy**

```bash
gh pr merge --squash --delete-branch
gh run watch --workflow web-deploy.yml
```

- [ ] **Step 4: Verify live site**

```bash
curl -s https://artemiop.com/TradePilot/ | grep -c "TradePilot"
```

Expected: ≥ 1, and a manual visual pass of `/TradePilot/` (branding, dark mode toggle, gallery loads, FeedbackFAB opens with `ArtemioPadilla/TradePilot` as target repo).

- [ ] **Step 5: File follow-up issues (the IDD way)**

```bash
gh issue create --title "Wire claude.yml + cd.yml automation workflows" --label "phase:0,type:chore" \
  --body "Inceptor's claude.yml/cd.yml were skipped in Phase 0 (need ANTHROPIC_API_KEY secret + automation policy)."
gh issue create --title "Phase 1: Supabase data layer + auth" --label "phase:1,type:feature" \
  --body "Per spec §2: project setup, migrations (10 tables + RLS), PKCE auth, adapter layer. Includes removing root Firebase files (firebase.json, firestore.*, storage.rules, functions/, web Firebase service worker remnants)."
```

---

## Out of scope for this plan

- Supabase (Phase 1), engine port (Phase 2), any feature pages.
- Landing page redesign (copy swap only), blog/docs content curation (Phase 6).
- `claude.yml`/`cd.yml` automation (follow-up issue), root Firebase file cleanup (Phase 1 issue).
