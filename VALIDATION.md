# Validation · redesigned Sway

## Passed

- TypeScript and ESLint for the Expo app.
- 18 domain tests: swipe thresholds/directions/flicks, three-way counts, split decisions, low-sample score suppression, last 50 guesses, insight minimum evidence, consecutive-day logic, headline grouping, feed text cleanup, link de-duplication, excerpts, topic fallback and summary validation.
- Local PGlite/Postgres integration checks: migration executes; response uniqueness/finality; idempotent retry does not double-count; trigger totals; 60 new responses per device per minute; other-device isolation; challenge and assertion replay rejection; anonymous client table/function denial; RLS enabled on all nine tables.
- Deno type-checks for both Edge Functions and their pinned dependencies.
- iOS and Android JavaScript/Hermes exports. These are not installed or signed native binaries.
- Independent Impeccable review at source scope. It confirmed the redesign is substantial and identified persistence, insight-state, and share-sheet overflow issues; fixes were applied and rechecked.

## Not verified / not activated

No native simulator runtimes or connected phones were available. No native screenshots, physical gestures, source-link arbitration, VoiceOver, large-text layouts, share-sheet behavior or output image dimensions, or 60fps measurements were verified. Test these on the user's iPhone.

No Supabase project has been created, no functions deployed, no scheduler installed, and no production security advisors run. No Apple/Google attestation or paid AI calls were performed. Backend source must be configured and verified against the real platform before release.

Impeccable's engine download failed its checksum verification; the engine was not run. Written skill guidance and independent source review were used. Documentation reflects source evidence, not claimed rendered approval.

## Dependency advisories

The SDK-compatible install reports 31 audit findings (20 high, 11 moderate), including upstream transitive dependencies. Do not apply incompatible automatic framework downgrades blindly. Resolve compatible upstream updates and review the Edge Function dependency tree before production deployment. No exploitable Sway-specific vulnerability is claimed solely from these package counts.
