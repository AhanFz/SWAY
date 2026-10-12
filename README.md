# Sway

A native iPhone/Android news sentiment app. This build substantially redesigns the first prototype and implements the next-stage app flows and backend source.

## Try it on iPhone

1. Install Expo Go compatible with Expo SDK 57.
2. Keep your phone and Mac on the same Wi-Fi.
3. Double-click `Start Sway.command`, or run `npm install` then `npm start` in this directory.
4. Scan the displayed QR code with the iPhone camera. If Sway was already open, fully reload it so the new native modules and navigation load.

The default is **sample mode** because live service credentials are not configured. Eight supplied prototype stories and their simulated totals let you try reading, voting, guessing, recap, settings, local history, and sharing. The app labels this mode. Sample votes never go to the server.

The sample deck is finite and responses persist. Reloading no longer erases decisions. To start a fresh sample test, clear this app's development storage or use a fresh development install; there is deliberately no undo/revote control.

## What changed visually

- A larger editorial headline on a flatter reading sheet, with simpler source hierarchy.
- No permanently reserved results strip competing with the story.
- Filled reaction buttons and clearer separation between reading and responding.
- Persistent Read, Recap, and You tabs.
- A compact, one-tap crowd guess/reveal; a more spacious recap and private settings screen.
- Updated light/dark palette and a native share sheet with a portrait result-card preview.

Impeccable guided the layout and independent code review. Its executable could not verify its own release checksum, so the design was implemented directly from its written guidance. No native screenshots or hardware review were possible on this Mac.

## Implemented app flows

- Existing whole-card swipes, velocity thresholds, stamps, under-card lift, and equivalent buttons.
- Good/bad → one guess → result. Turning guessing off reveals directly. Skipping reveals only in Recap.
- SQLite history, preferences, final responses, pending submission retry, and automatic outbox recovery after reopening.
- SecureStore random installation ID; only its salted hash is sent in live mode.
- Last 50 scored guesses; near-ties within two percentage points among non-skip votes accept either guess.
- One private insight per session once supported by 10 votes or a five-event/day streak. Insights never enter sharing.
- 1080 × 1350 PNG via ViewShot and the native share sheet. “Include my vote” starts off. No sharing below 100 responses.
- Live feed pagination is centralized and has no daily limit. Previously responded stories are filtered locally.

## Backend source

Supabase migration, protected Edge Functions, free hourly RSS ingestion (no AI provider), and an hourly schedule script are included. Tests verify final-response constraints, trigger totals, rate limits, replay checks, and client denial. The live functions validate Apple App Attest / Google Play Integrity, with no unsigned-vote fallback.

**Not deployed:** no cloud project was created, no server secrets were configured, and no live news or attestation requests were run. Live voting requires a signed Sway build and registered platform identifiers. See `BACKEND-SETUP.md` for exact setup and remaining verification.

## Phone test checklist

1. Drag from the headline and summary; short drags return, right/left/down commit, up resists.
2. Swipe quickly across several cards, including with an unavailable network in a configured test build. Close/reopen and verify final responses remain.
3. Tap source links and return: no accidental vote should occur.
4. Vote good/bad: no percentages before guessing. Answer once. Try “Don’t ask me,” then restore guessing in You.
5. Skip: no result for that story in Read; it appears in Recap. There is no back-to-vote action.
6. Guess on at least five stories; check the private score and eligible streak insight. Non-streak ten-vote patterns are unit-tested because the sample fixture has only eight stories.
7. Share a result. Confirm the PNG is 1080 × 1350, has all three percentages, headline, date, and Sway name. Verify your choice appears only after enabling the toggle; no personal score or insight ever appears.
8. Test dark mode, VoiceOver, Reduce Motion, large text, and a small iPhone. Scroll outside the card to reach overflow content; summaries themselves never scroll.

## Automated checks

```sh
npm run typecheck
npm run lint
npm test
npm run test:backend
npx expo export --platform ios --platform android
npx deno check --config supabase/functions/deno.json supabase/functions/sway-api/index.ts supabase/functions/ingest-news/index.ts
```

Node 22.18+ is required for the TypeScript tests (validated on Node 26.9). Dependencies and Deno imports are lockfile-pinned. See `VALIDATION.md` for actual evidence and limitations.
