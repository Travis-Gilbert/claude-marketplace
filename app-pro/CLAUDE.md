# App-Pro Plugin

You have access to React Native source code, Expo Router internals, service
worker tooling (Serwist + Workbox), offline database source (WatermelonDB),
gesture and animation libraries (Reanimated, Gesture Handler), mobile
visualization renderers (Skia, Victory Native), Capacitor bridge code, and
Django JWT authentication source. Use them.

## When You Start a Mobile App Task

1. Determine the task category. Read the relevant agent in agents/.
2. Check refs/ for the libraries you will use. Grep the source to verify
   API signatures and internal behavior rather than relying on memory.
3. If the task involves PWA setup, read references/pwa-caching-strategies.md
   to choose the right caching strategy per route type before writing any
   service worker code.
4. If the task involves React Native architecture, read
   references/rn-architecture-patterns.md to confirm navigation structure
   and state management before scaffolding the app.
5. If the task involves offline sync, read references/offline-sync-protocol.md
   to determine whether read-path or write-path offline is needed before
   implementing any cache or queue logic.
6. If the task involves mobile visualization, read
   references/mobile-viz-adaptation.md to select the right adaptation level
   (resize, simplify, substitute, or defer to native) before writing any
   rendering code.

## Source References

Library source is in refs/. Use it to verify API details:
- React Native components, lists, animation: refs/react-native/Libraries/
- Expo Router routing, layouts, typed routes: refs/expo-router/src/
- React Navigation navigators, linking: refs/react-navigation/packages/
- Service worker strategies: refs/workbox/packages/workbox-strategies/
- Next.js service worker integration: refs/serwist/packages/next/
- Offline-first database and sync: refs/watermelondb/src/
- Server state management: refs/tanstack-query/packages/
- Capacitor native bridge: refs/capacitor/core/
- 2D rendering for RN: refs/react-native-skia/package/src/
- Charts for RN: refs/victory-native/src/
- Animation on UI thread: refs/react-native-reanimated/src/
- Touch/gesture system: refs/react-native-gesture-handler/src/
- Secure storage: refs/expo-secure-store/
- Push notifications: refs/expo-notifications/
- Fast key-value store: refs/mmkv/src/
- Django JWT auth: refs/simplejwt/rest_framework_simplejwt/

## Reference Library

Curated knowledge docs in references/. Read the relevant one before starting:
- pwa-caching-strategies.md: CacheFirst, NetworkFirst, StaleWhileRevalidate per route
- rn-architecture-patterns.md: Navigation, state, data, platform adaptation
- offline-sync-protocol.md: Read-path vs write-path, conflict resolution strategies
- mobile-api-shape.md: Token auth, cursor pagination, sparse fields, composites
- mobile-performance-budgets.md: LCP, INP, bundle size, battery targets
- touch-interaction-patterns.md: Touch targets, thumb zone, gestures, safe areas
- mobile-viz-adaptation.md: Adaptation level selection per visualization type
- push-notification-architecture.md: FCM, APNs, Django + Celery integration
- capacitor-bridge-patterns.md: Static export, native plugins, server.url mode
- quick-capture-patterns.md: Share targets, widgets, deep links, offline queue

## Agent Loading

Agents are composable. A single task may load multiple agents. Read the
relevant agent .md file(s) before starting work. See AGENTS.md for routing.

## Rules

1. NEVER write a service worker caching strategy without stating which
   strategy applies to which route type and why. Static assets, API
   responses, HTML pages, and RSC payloads each need different treatment.

2. NEVER write React Native layout code using CSS concepts that do not
   exist in RN. No media queries, no :hover, no CSS Grid, no calc().
   Flexbox works but defaults differ from web (flexDirection: 'column').

3. NEVER implement offline write support without a conflict resolution
   strategy. "Last write wins" is valid but must be deliberate, not accidental.

4. NEVER position primary mobile actions in the top corners of the screen.
   Bottom-center and bottom-right are the most reachable one-handed.

5. NEVER ship a mobile visualization without testing on a mid-range
   Android device (or Chrome DevTools with 4x CPU throttle minimum).

6. NEVER build mobile API endpoints that return the full object graph.
   Use sparse fieldsets, paginate aggressively, composite endpoints.

7. NEVER store authentication tokens in AsyncStorage or localStorage.
   Use expo-secure-store, react-native-keychain, or EncryptedSharedPreferences.

8. When adapting a D3 visualization for mobile, ALWAYS determine the
   adaptation level BEFORE writing code: resize, simplify, substitute,
   or defer to native. Read references/mobile-viz-adaptation.md.

## Cross-Reference with Other Plugins

- Django model design, ORM, serializers: defer to Django-Engine-Pro
- D3 visualization architecture: defer to D3-Pro
- General JavaScript/React patterns: defer to JS-Pro
- UI component design and visual hierarchy: defer to ui-design-pro
- Three.js/R3F/WebGL: defer to Three-Pro
- UX research and accessibility: defer to ux-pro
- Next.js architecture: defer to Next-Pro

This plugin owns: PWA retrofitting, React Native architecture, Expo Router
navigation, Capacitor bridging, offline sync protocols, mobile API design,
push notification infrastructure, Quick Capture flows, mobile performance
optimization, touch interaction engineering, and mobile visualization
adaptation strategy.

## Compound Learning Layer

This plugin learns from your work sessions. Three things happen automatically.

### At Session Start
1. Read `knowledge/manifest.json` for stats and last update time
2. Read `knowledge/claims.jsonl` for active claims relevant to this task
   (filter by domain and tags matching the agents you are loading)
3. When a claim's confidence > 0.8 and it conflicts with static
   instructions, follow the claim. It represents learned behavior.
4. When a claim's confidence < 0.5 and it conflicts with static
   instructions, follow the static instructions.

### During the Session (Passive Tracking)
- Note which claims you consult and why
- Note suggestion outcomes (accepted, modified, rejected)
- Note patterns not yet in the knowledge base
- Note any corrections the user makes that contradict existing claims

### When a Problem Is Solved (Auto-Capture)

When you detect that a non-trivial problem has been solved (trigger
phrases: "that worked", "it's fixed", "working now", "problem solved",
"that was the issue", or the user explicitly asks you to capture/document
a fix), perform a compact capture before continuing:

1. Assess: is this worth capturing? Skip trivial typo fixes, simple
   config changes, or problems with obvious one-line solutions. Capture
   when the root cause required investigation, the fix involved
   understanding something non-obvious, or the pattern is likely to
   recur.

2. If worth capturing, write a solution doc to `knowledge/solutions/`:
   - Filename: `[domain-slug]-[YYYY-MM-DD].md`
     If the file exists, append a counter: `[domain-slug]-[YYYY-MM-DD]-2.md`
   - Format: Problem, Root Cause, Solution, Prevention, Claims Extracted
   - Keep it concise. 10-30 lines total.

3. Extract 2-5 typed Claims from the solution. Each claim should be:
   - A single imperative statement (starts with a verb or "always/never")
   - Scoped to one actionable practice
   - Tagged with the relevant domain from the agent domain map

4. For each candidate claim, compute the claim_id (sha256 of
   "[plugin]:[lowercased text]", first 12 hex chars). Skip if that ID
   already exists in claims.jsonl.

5. Append new claims to `knowledge/claims.jsonl` as JSON lines:
   ```json
   {"id":"[hash]","text":"[claim]","domain":"[domain]","agent_source":"[agent]","type":"empirical","confidence":0.667,"source":"auto-capture","first_seen":"[date]","last_validated":"[date]","status":"active","evidence":{"accepted":0,"rejected":0,"modified":0},"projects_seen":["[project]"],"tags":["[tag1]","[tag2]"],"related_claims":[]}
   ```

6. Print a brief confirmation:
   ```
   [compound] Captured: [brief problem summary]
     Solution: knowledge/solutions/[filename].md
     Claims: +N new, M skipped (duplicate)
   ```

7. Log an `auto_capture` event in your mental session log:
   ```json
   {"event":"auto_capture","claims_added":["[hash1]","[hash2]"],"solution_file":"knowledge/solutions/[filename].md","domain":"[domain]","project":"[project]"}
   ```

8. Continue with whatever the user asked for next. Do not pause for
   review. The /learn command handles review.

### At Session End
Run `/learn` to save the session log, update confidence scores, and
review any items that need attention. This is optional but recommended
after substantial sessions.
