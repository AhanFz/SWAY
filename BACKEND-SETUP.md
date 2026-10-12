# Activate Sway’s live service

The code is prepared. Cloud provisioning is pending the user's choice of Supabase organization and the required cost confirmation. No project has been created or modified.

## 1. Supabase project and schema

Create/select the intended Supabase project. Apply the generated migration in `supabase/migrations/`. It creates feeds, stories, source links, responses, trigger-maintained totals, attestation keys/challenges, feed snippets, and a pipeline lease. Row-level security is enabled everywhere. Client roles cannot read or mutate these tables or invoke privileged RPCs; the Edge Functions use the server-only service role.

The functions use SECURITY INVOKER, empty search paths, and explicit service-role grants. There are no user accounts. After deployment run the Supabase security and performance advisors and address findings before release.

## 2. Edge Functions

Deploy `sway-api` and `ingest-news` with their shared modules, `deno.json`, and `deno.lock`. Per-function `verify_jwt=false` is intentional: there is no user JWT. Public feed/results reads are narrowly projected; all voting mutations require verified App Attest/Play Integrity proofs and database replay checks. The cron endpoint requires a separate server-only bearer secret.

Configure server secrets from `supabase/.env.example` through Supabase secret management. Never copy them into EXPO_PUBLIC variables or the app bundle. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the hosted Edge runtime.

The app only needs EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. A missing configuration keeps it in sample mode. Live connection failures never silently switch to fake crowd data.

## 3. iPhone App Attest

Register your own Apple App ID; set SWAY_IOS_BUNDLE_ID for the native build and the same APPLE_BUNDLE_ID on the server, plus APPLE_TEAM_ID. `app.config.ts` configures the App Attest entitlement. Use matching development/production attestation environments; production is the default. For development, explicitly set SWAY_ATTEST_ENV=development and APPLE_ATTEST_ENV=development.

Create a signed native build through your Apple/Expo development setup. App Attest cannot be validated for Sway's identity merely by running the sample in Expo Go. The app generates a secure key, attests a one-time server challenge, then signs each response payload. The server verifies the certificate/assertion via the pinned node-app-attest library and atomically consumes challenges and advances counters.

Real Apple attestation has not been exercised. Registration recovery after reinstall/key invalidation should be tested; failed requests remain pending and do not count as accepted votes.

## 4. Android Play Integrity

Set your registered SWAY_ANDROID_PACKAGE, matching ANDROID_PACKAGE_NAME, EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER, the accepted certificate SHA-256 digests in Google's base64url representation, and GOOGLE_SERVICE_ACCOUNT_JSON as a server secret. Enable Play Integrity and link the correct Google Cloud/Play project. Use a signed recognized and licensed test distribution.

The server exchanges a signed service-account assertion for an access token and asks Google to decode the integrity token. It checks package, certificate, freshness, request hash, PLAY_RECOGNIZED, MEETS_DEVICE_INTEGRITY, and LICENSED. Missing credentials or invalid verdicts fail closed. Real Google attestation has not been exercised.

## 5. Hourly news collection (free, no AI)

No AI key is needed. The only secret is NEWS_CRON_SECRET (any long random string).

Every hour the `ingest-news` function fetches all active RSS feeds in parallel, strips and bounds the text, never fetches full articles, and saves everything new from the last 48 hours in one batched database call. Each story shows the outlet's own headline and feed blurb (trimmed to whole sentences, 80 words at most) with a link to the original. Nothing is rewritten or generated. Items with fewer than 8 words of blurb are skipped.

Reports of the same event from different outlets are attached to one story when their headlines share enough significant words (NEWS_SIMILARITY_THRESHOLD, default 0.6, at least 3 shared words, within 48 hours). This is deliberately cautious: it will sometimes leave two outlets' versions as separate stories rather than merge unrelated ones. Grouping quality still needs evaluation on real feeds.

Sources: 23 feeds are seeded across NPR, BBC News, BBC Sport, The Guardian, and Al Jazeera. Section feeds carry a fixed topic (`feeds.topic`); general feeds are classified by keyword. To add an outlet, insert an active `feeds` row and add its RSS hostname to FEED_HOST_ALLOWLIST. Redirects, oversized feeds, XML DTDs, and entities are rejected. Check each outlet's RSS terms of use before a public or commercial launch.

Save matching Vault secrets `sway_project_url` and `sway_news_cron_secret`, then run `supabase/schedule.sql` to schedule the job at the top of every hour. The job has a lease to prevent overlap and isolates per-feed and per-item failures. Its response reports `feeds`, `failedFeeds`, `newStories`, `newArticles`, and `skipped`; inspect these after activation. The schedule has not been installed or executed, and only the NPR feed URLs were confirmed reachable during this change.


## Privacy and verification boundaries

- No names, emails, phone numbers, account records, demographic fields, or IP-address columns exist in the app schema.
- Guesses, scores, insights, and the local feed-exclusion history are not sent to the server.
- Stable device hashes and attestation keys are pseudonymous technical identifiers. Responses from the same installation are linkable in the database; do not advertise them as mathematically untraceable. Reinstallation can create a new installation identity, especially on Android; platform attestation alone is not a permanent physical-device identifier.
- Application functions do not log bodies or IPs. Supabase/hosting infrastructure may retain request metadata independently; review platform logging and retention before making a no-IP-storage promise.
- The 20-response privacy threshold is enforced at the result endpoint; the 100-response sharing gate is also enforced by the app.
- Domain/database tests and Deno checks passed locally. Real attestation, deployment, scheduler execution, news ingestion, native sharing dimensions, 60fps gestures, and phone accessibility are still unverified.

Official references: [Supabase function authorization](https://supabase.com/docs/guides/functions/auth-headers), [scheduled functions](https://supabase.com/docs/guides/functions/schedule-functions), [Expo AppIntegrity](https://docs.expo.dev/versions/v57.0.0/sdk/app-integrity/), [Play Integrity](https://developer.android.com/google/play/integrity/standard), [OpenAI embeddings](https://developers.openai.com/api/reference/resources/embeddings/methods/create).
