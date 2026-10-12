---
name: Sway
description: Native news reading with direct reactions and a private crowd comparison.
colors:
  light-bg: "#F1F3FA"
  light-surface: "#FFFFFF"
  light-ink: "#172039"
  light-muted: "#59647A"
  light-line: "#D9DFEC"
  light-accent: "#3149D8"
  light-accentSoft: "#E4E9FF"
  light-onAccent: "#FFFFFF"
  light-goodText: "#096443"
  light-good: "#117854"
  light-bad: "#B63B39"
  light-skip: "#798399"
  light-goodSoft: "#E3F2EA"
  light-badSoft: "#FBE9E6"
  dark-bg: "#0D1322"
  dark-surface: "#192238"
  dark-ink: "#F2F4FA"
  dark-muted: "#A6B1C8"
  dark-line: "#303D57"
  dark-accent: "#A6B3FF"
  dark-accentSoft: "#25315A"
  dark-onAccent: "#111936"
  dark-goodText: "#73DFAD"
  dark-good: "#73DFAD"
  dark-bad: "#FF9C91"
  dark-skip: "#8F9BB3"
  dark-goodSoft: "#183F34"
  dark-badSoft: "#4A292E"
typography:
  display:
    fontFamily: "Bricolage Grotesque"
    fontWeight: 800
    fontSize: "40px"
    letterSpacing: "-1.4px"
  headline:
    fontFamily: "Bricolage Grotesque"
    fontWeight: 800
    fontSize: "32px"
    lineHeight: 36
    letterSpacing: "-0.4px"
  title:
    fontFamily: "Bricolage Grotesque"
    fontWeight: 800
    fontSize: "21px"
  body:
    fontFamily: "Atkinson Hyperlegible"
    fontWeight: 400
    fontSize: "16.5px"
    lineHeight: 24.75
  label:
    fontFamily: "Atkinson Hyperlegible"
    fontWeight: 700
    fontSize: "16px"
rounded:
  card: "16px"
  reaction: "14px"
  button: "12px"
  choice: "10px"
  topic: "5px"
  bar: "3px"
  sheet: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "28px"
components:
  story-card:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.card}"
    padding: "26px"
  button-primary:
    backgroundColor: "{colors.light-accent}"
    textColor: "{colors.light-onAccent}"
    rounded: "{rounded.button}"
    padding: "0px 20px"
  button-quiet:
    backgroundColor: "{colors.light-accentSoft}"
    textColor: "{colors.light-accent}"
    rounded: "{rounded.button}"
  button-good:
    backgroundColor: "{colors.light-good}"
    textColor: "{colors.light-surface}"
    rounded: "{rounded.reaction}"
    typography: "{typography.label}"
  button-bad:
    backgroundColor: "{colors.light-bad}"
    textColor: "{colors.light-surface}"
    rounded: "{rounded.reaction}"
    typography: "{typography.label}"
  button-skip:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-muted}"
    rounded: "{rounded.reaction}"
    typography: "{typography.label}"
  topic:
    backgroundColor: "{colors.light-accentSoft}"
    textColor: "{colors.light-accent}"
    rounded: "{rounded.topic}"
    padding: "5px 8px"
  crowd-panel:
    backgroundColor: "{colors.light-accentSoft}"
    textColor: "{colors.light-ink}"
    rounded: "{rounded.card}"
    padding: "16px"
---
> **Theme update (2026-10-06):** the app now uses a shadcn/ui-style token set and component layer.
> `src/theme.ts` is the source of truth (white/near-black surfaces, cyan `#58D3DB` primary, 8px radius, Open Sans,
> borders instead of shadows) and `src/components/ui/` holds the primitives (Button, Card, Badge, Tabs, Switch, Alert,
> Separator, Text). The colour, type, radius and component values below describe the previous indigo design and are kept for reference only.


# Design System: Sway

## Overview

**Creative North Star: "One story, one reaction"**

Sway gives neutral news a generous reading surface, then makes the reader’s response immediate and the crowd comparison optional. The established Bricolage Grotesque and Atkinson Hyperlegible pairing now has a stronger editorial hierarchy: larger headlines, quiet grouped sources, and solid reaction controls. Cool near-white surfaces, cobalt navigation, forest green, and muted coral define the refreshed light palette; deep navy surfaces carry the dark theme.

This documents the substantive native redesign from source inspection only. Sources are `PRODUCT.md`, `.impeccable/surface.md`, `src/theme.ts`, the three tab screens, and shared components. No simulator or hardware captures were produced or reviewed for this documentation. Native layout, gestures, text scaling, screen-reader usability, and sharing remain subject to device verification. Sidecar previews are illustrative HTML translations of native components, not rendered app evidence or a web product.

**Key Characteristics:**
- A flatter reading sheet with a larger headline and grouped reporting sources.
- Solid Bad and Good controls with a quieter Skip control.
- Conditional crowd comparison and persistent Read, Recap, and You destinations.
- Private guesses and insights separated from the shareable crowd result.

## Colors

### Primary

Cobalt `accent` identifies navigation, source links, topic labels, wordmark punctuation, and primary actions. `accentSoft` provides restrained support for sample labels, guess panels, quiet actions, and private insights. `onAccent` supplies foreground contrast for filled accent controls in each theme.

### Secondary

Forest `good` and muted coral `bad` encode reactions and bar segments. `goodText` is the darker light-theme green used for small positive labels and result percentages; it is distinct from the solid control fill. `skip` fills the neutral result segment; Skip button labels use `muted`. Text and icons accompany reaction colors. `badSoft` is the error-notice background. `goodSoft` remains an exported palette entry but is not an observed component background.

### Neutral

`bg` is the cool page field, `surface` the reading sheet and tab bar, `ink` the main text, `muted` the secondary text, and `line` the restrained separator. Paired light/dark tokens are normative in the frontmatter. System, light, and dark appearance choices live in You. The share image deliberately uses the light theme in both app appearances.

**The Semantic Foreground Rule.** Use goodText for positive result text; use good for reaction fills and result segments. Dark reaction controls use the dark page background for their foreground.

## Typography

The app loads Bricolage Grotesque ExtraBold and Atkinson Hyperlegible Regular/Bold with native aliases `BricolageExtraBold`, `AtkinsonRegular`, and `AtkinsonBold`. Sidecar HTML falls back to generic sans-serif if those fonts are unavailable; it does not prove native font loading.

The main wordmark and screen headers use display (40, tracking -1.4). Reading headlines use headline (32/36), or 28/31 below a card height of 450. Summary body begins at 16.5 with a 1.5 line-height multiplier. Measured overflow reduces summary size in 0.5 steps to 12.5, then requests a taller card; unmeasured and zero-height summary space are distinct states. Native logical units are represented as px in the portable frontmatter; lineHeight records absolute native values.

The reaction question uses display at 20 and controls use bold 16. Crowd prompts use title at 21. Recap uses a 26/31 summary, 23/28 story headings, and 30-point score. You uses a 30/35 lead, 17-point bold labels, and 15/23 body. Topic labels are 11-point bold; metadata is 11–12 and source links are bold 14. Results use tabular display numerals at 17 or 24. The native UI retains default font scaling; the fixed-format exported share image explicitly disables it.

## Layout

A centered native column has maximum width 480. Read uses horizontal inset 20, bottom inset 18, and gap 14. Recap and You use horizontal inset 24 with gaps 20 and 24. Safe-area-aware scrolling supports short screens and large text. These are native layouts without web breakpoint rules.

Read flows from the header and any error notice to an optional crowd panel, the reading deck, the reaction question, solid controls, and the gesture hint. There is no permanent blank result slot. The deck starts at `max(415 × max(fontScale, 1), requiredHeight) + 24`, allowing measured content growth. Cards use padding 26, or 22 below height 450, and internal gap 18. Reporting links wrap beneath a labeled divider with 48-point targets. Bad and Good share equal width; Skip receives 0.56 of their flex weight. Controls have minimum height 58.

The tab bar remains available across Read, Recap, and You. The share sheet is bottom-aligned and scrollable, capped below the top safe area, with bottom safe-area padding. Its preview is at most 320 wide, in a 4:5 ratio, and exports at 1080 × 1350.

## Elevation & Depth

The redesign is flatter, not completely shadowless. The borderless reading sheet has a low native shadow: color `#141A24`, offset (0, 10), opacity 0.07, radius 18, Android elevation 2. Cards behind it step down 12 and scale down 0.045 per depth level. Crowd panels and private insights use tone; recap and settings sections use separators. The share sheet is separated by a black 40% scrim.

## Shapes

The reading sheet, crowd panel, and private containers have gently rounded corners (16). Reaction controls are rounded rectangles (14), common buttons are 12, guess choices and appearance selectors are 10, and topic labels are compact 5-radius tags. Result bars have tight corners (3), rather than pill silhouettes. The modal sheet rounds only its top corners (24). Gesture stamps retain a three-unit outline and radius 10.

## Components

### Reading sheet and source group

Outlet names and age precede the large headline and summary. A topic tag and word count follow the summary. “Read the original reporting” introduces linked sources below a fine divider. Only the top card is interactive or exposed to accessibility; each source link names its outlet and reports opening failure through a native alert.

Right commits Good, left Bad, and down Skip. Buttons perform the equivalent final actions. Gesture stamps show literal GOOD/BAD/SKIP labels. A pan begins after 8 points; horizontal completion uses 28% of width, downward completion 18% of height, with velocity rules in `src/domain/gestures.ts`. Exit duration is 180–340 ms. Return spring uses damping 16, stiffness 210, mass 0.7. Reduced motion removes rotation and exit duration; return-spring motion is still present in the implementation.

### Buttons, tags, and settings

Bad and Good are solid semantic buttons with white light-theme foregrounds and dark-background foregrounds in dark mode. Skip remains surface-colored with muted text. Reaction press opacity is 0.65. General primary and quiet buttons are at least 48 high, with pressed opacity 0.7 and disabled opacity 0.4. Guess choices press at 0.6. Topic tags are informational, not filters. Appearance choices expose radio roles and checked state; switches have explicit accessible labels. No text-input component is implemented.

### Navigation

Native bottom tabs pair Feather icons with 11-point bold labels. Read, Recap, and You use accent for the active destination, muted for inactive destinations, and a surface background with a fine top separator. There is no observed native hover styling or custom keyboard focus ring. HTML preview focus treatments are preview affordances only.

### Guess and reveal

A conditional accent-soft panel asks “What did most people say?” after a non-skip response. Good and Bad guesses use surface-filled choices; “Don’t ask me” disables future guessing. Confirmed revealed responses show a proportional Good/Skipped/Bad bar with labels, percentages, and response count. Below 20 responses, the UI says “Not enough votes yet.” Below 100, it offers result refresh and says sharing needs more votes. Saving and failed-send states use explicit text. Sample data retains its sample/simulated labels.

### Recap and private insights

Recap shows the current session, or the latest stored session when the current one is empty, using separated story rows. Its empty state points back to reading. A local “Read the room” score and optional accent-soft insight are distinct from public result statistics. You contains the score, guessing preference, appearance settings, and device-privacy explanation. Guesses, score, and insights are not included in shared images.

### Share sheet

“Share the room” opens a native modal with Done, a light-theme result preview, an initially-off “Include my vote” switch, and Share image. At least 100 responses are required. The action becomes disabled while “Preparing image…” is shown; failures use a native alert. The image contains headline, question, crowd breakdown, count, date, and optionally the user’s response. The share sheet uses slide animation; reduced-motion handling for this modal is not established in source.

### Loading, error, and empty states

Loading uses an accent activity indicator with a “Loading stories” accessibility label. Error notices use badSoft, a polite live region, and Retry. Read distinguishes the end of the sample deck from being up to date, with recap and live-feed refresh actions as applicable. Result bars expose a combined accessible label containing all percentages and the response total. Source inspection does not establish device-level accessibility conformance.

## Do's and Don'ts

### Do:
- Do preserve the larger editorial hierarchy, flat reading sheet, and grouped reporting sources.
- Do use goodText for positive result text and solid semantic fills for reaction controls.
- Do keep equivalent reaction buttons, source links, and scrolling available at large text sizes.
- Do label sample stories and simulated crowd totals clearly.
- Do keep private guesses and insights out of the shared crowd image.

### Don't:
- Don't restore a permanent empty result slot above the reading deck.
- Don't substitute photos, decorative gradients, or ornamental metrics for the reading surface.
- Don't treat summary shrink-to-fit as permission to clip content; retain height growth and scrolling.
- Don't claim native visual or accessibility validation from source inspection or HTML previews.
