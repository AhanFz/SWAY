# Build prompt: Sway, an anonymous news sentiment app

Paste everything below into your AI coding tool, and attach `sway-prototype.html` with it.

---

You are building **Sway**, a mobile app where people read short news summaries and swipe to say whether each story is good or bad news. Votes are anonymous. The reason people vote is to find out how everyone else sees the same story.

The attached `sway-prototype.html` is a working single-file web prototype. Treat it as the reference for look, feel and swipe behavior. Open it in a phone-sized browser before you start. Where this prompt and the prototype disagree, this prompt wins.

## 1. Product in one paragraph

The user sees a stack of cards. Each card is one news story: a topic label, the outlets it came from, a headline, a 60–100 word neutral summary, the question "Is this good news?", and links to the original articles. The user swipes right for good, left for bad, or down to skip. After a vote they guess what the crowd said, then see the real result. The app never shows who voted what, and the server never stores anything that identifies a person.

## 2. What already exists in the prototype (keep all of it)

**Card**

- Topic chip, source names and age ("NPR + Al Jazeera · 5h ago"), headline, summary, word count, the question, and one link per source.
- A story covered by several outlets is one card with several source links.
- The summary never scrolls. If it is too long for the card, shrink the font size in 0.5px steps from 16.5px down to a floor of 12.5px until it fits.
- Tapping a source link opens the article and must not start a swipe.

**Swipe gestures**

- The whole card is the swipe surface, including the summary text.
- Right = good, left = bad, down = skip. Dragging up is resisted (moves at 25% of finger travel).
- The card follows the finger and tilts 0.05 degrees per pixel of horizontal travel.
- A GOOD, BAD or SKIP stamp fades in on the card as the drag passes toward the threshold.
- The card underneath rises and scales up as the top card is dragged.
- A vote commits when the drag passes 28% of card width (18% of card height for skip), or on a flick: release speed above 0.45 px/ms with at least 30px of travel in that direction.
- A drag released short of the threshold springs back with a slight overshoot.
- On commit the card flies off in the swipe direction. Exit time scales with flick speed, between 180ms and 340ms.
- The next card is swipeable immediately. The user can swipe several cards in quick succession without waiting for animations.
- Three cards are kept in the stack at all times.

**Other controls**

- Bad, Skip and Good buttons below the stack do the same as the swipes, for people who can't or don't want to swipe.
- A progress counter ("3 of 8") in the header.

**Results bar**

- One bar in three parts: green for good, grey for skipped, red for bad, each as a share of everyone who responded to the story. Example: 50 good, 20 skipped, 30 bad out of 100 gives 50% / 20% / 30%.
- Percentages are shown as text under the bar, with the total number of responses.

**Recap screen**

- Shown at the end of a session: one row per story with topic, total responses, the user's own response, and the three-part bar.
- A line at the top: "You voted on X of Y stories and sided with the majority on Z."

**Visual style**

- Light and dark themes. Colors, fonts, spacing and corner radii are defined as tokens at the top of the prototype's stylesheet. Reuse those values.

## 3. Changes to make

### 3.1 Guess the crowd (new)

After the user votes good or bad, and before any result is shown:

1. The voted card flies off as usual.
2. A compact prompt appears over the top of the stack: "What did most people say?" with two large buttons, **Good** and **Bad**.
3. One tap answers. The prompt must not block for more than one tap. Include a small "Don't ask me" link that turns guessing off in settings.
4. Then the result reveals: the three-part bar, percentages, total responses, and one line that says whether the guess was right ("You read the room" or "The crowd surprised you").

Rules:

- "Most people" means the larger of good and bad. Skips are ignored when deciding the majority.
- If good and bad are within 2 percentage points, any guess counts as correct and the reveal says "Split decision."
- The guess is never sent to other users and never changes the vote tally.
- Keep a private "read the room" score: correct guesses out of the last 50, shown as a percentage in the recap and the profile.
- If guessing is turned off, the result reveals straight after the vote, as in the prototype.

### 3.2 Don't reveal on skip (change)

- Swiping down records a skip and moves on. No result strip, no bar, no guess prompt.
- Skipped stories appear in the recap screen with their results, marked "you skipped."
- A response is final. A user cannot skip, see the result in the recap, then go back and vote.

### 3.3 Personal pattern insights (new)

These are observations about the user's own voting history across days. They are different from a single story's result.

Examples:

- "You've been in the minority 5 days in a row."
- "You sided with the majority on 8 of your last 10 votes."
- "You're most contrarian on Tech: you disagree with the crowd 70% of the time."
- "You skip most Politics stories."
- "You've read the room correctly 6 times in a row."

Rules:

- Show at most one insight per session, as a card inserted into the recap screen.
- Only show an insight when it is backed by at least 10 votes (5 for streaks).
- Compute insights on the device from locally stored history. Do not send the user's vote history anywhere for this.
- Insights are private. They are never shareable and never visible to anyone else.
- Wording is neutral. Never imply the user is wrong for being in the minority.

### 3.4 Shareable result cards (new)

- Every revealed result and every recap row has a Share button.
- It produces an image (1080 × 1350) containing: the headline, the question "Is this good news?", the three-part bar with percentages, the total number of responses, the date, and the Sway name.
- The image contains nothing about the person sharing. Add an optional toggle, off by default: "Include my vote."
- Hand the image to the phone's native share sheet.
- Do not offer sharing for stories with fewer than 100 responses. Show "Not enough votes to share yet" instead.

### 3.5 Daily deck (not now)

Do not limit how many stories a user can vote on per day. Build the feed as a continuous stream of the newest stories the user hasn't responded to. Keep the feed query in one place so a daily cap can be added later without restructuring.

## 4. Anonymity and bot protection

- No sign-up, no email, no phone number, no name.
- Use device attestation to prove each vote comes from a real, unmodified copy of the app: App Attest on iOS, Play Integrity on Android. The server verifies the attestation before accepting a vote.
- Identify a device by a random ID generated on first launch and stored in the phone's secure storage. Send only a salted hash of it.
- One response per device per story, enforced by a unique rule in the database.
- Do not store IP addresses alongside votes. Do not log request bodies.
- Rate limit: reject more than 60 responses per minute from one device.
- Results for a story with fewer than 20 responses show "Not enough votes yet" instead of percentages.

## 5. News pipeline (server, scheduled every 30 minutes)

1. Fetch new items from a list of RSS feeds stored in a config table. Start with NPR and Al Jazeera, and make it easy to add more.
2. Group items that cover the same event into one story. Compare headlines and descriptions with text embeddings, and merge items above a similarity threshold that were published within 48 hours of each other.
3. For each new story, call an AI model to write a neutral 60–100 word summary from the feed headlines and descriptions of all outlets in the group. The summary must be in original wording, state only what the sources say, include what each side argues where there is a dispute, and contain no opinion. Have the same call return one topic label from a fixed list.
4. If the sources together give too little material for 60 words, write a shorter summary. Never pad with facts that are not in the sources.
5. Save the story with its source links. Never store or display full article text.

## 6. Tech stack

- **App:** React Native with Expo, TypeScript. Gestures with `react-native-gesture-handler` and `react-native-reanimated`, running on the UI thread.
- **Backend:** Supabase (Postgres, Edge Functions, scheduled functions).
- **Summaries:** an AI model API called from the scheduled function. Keep the API key on the server only.
- **Share images:** `react-native-view-shot` plus `expo-sharing`.
- **Local history for insights:** on-device SQLite or MMKV.

## 7. Data model

- `feeds`: id, outlet name, RSS URL, active flag.
- `stories`: id, headline, summary, topic, published time, created time.
- `story_sources`: story id, outlet name, article URL.
- `responses`: story id, device hash, value (`good`, `bad` or `skip`), created time. Unique on (story id, device hash).
- `story_totals`: story id, good count, bad count, skip count. Updated by a database trigger on `responses`, so the app reads one row per story.

Guesses, the read-the-room score and insight history live on the device only.

## 8. Build order

1. Card stack and gestures, matching the prototype, with hard-coded stories.
2. Supabase tables, anonymous device ID, voting, and real totals.
3. Guess the crowd and the don't-reveal-on-skip change.
4. Recap screen, pattern insights, read-the-room score.
5. Share cards.
6. News pipeline.
7. Device attestation and rate limiting.

Stop after each step and tell me how to run and test it.

## 9. Done means

- Swiping feels the same as the prototype on a real iPhone and a real Android phone, at 60 frames per second.
- A swipe that starts on the summary text works exactly like one that starts on the headline.
- Voting twice on one story from one device is rejected by the server.
- Skipping shows nothing until the recap.
- A guess is asked after every good or bad vote unless turned off, and takes one tap.
- A shared image contains no information about the user unless they turned on "Include my vote."
- Nothing in the database can be traced to a person.

## 10. Out of scope for now

Photos on cards, comments, accounts, leaderboards, rewards, daily vote limits, demographic breakdowns, and a web version.
