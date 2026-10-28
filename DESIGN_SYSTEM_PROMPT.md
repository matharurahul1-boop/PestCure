# PestCure design system: prompt to paste into another tool

Copy everything inside the block below.

```
Build the UI with this exact design system: a calm, premium "frosted glass on soft green" look for a
pest-control company's team workspace (weekly reviews, KPIs, approvals). Mobile-first, installable PWA.

STACK
- React 19 + Vite + TypeScript, plain CSS with CSS variables (no Tailwind needed), lucide-react icons.
- Fonts (Google Fonts): "Manrope" for the app, "Plus Jakarta Sans" for the login page, "JetBrains Mono" for numbers/code.
  Weights 400-800. Headings 700-800, body 500, tiny labels 700 uppercase with letter-spacing .08-.12em.

BRAND COLOURS
- Primary green  #1b6a43 -> #2f9a6a (use as a 120deg gradient on primary buttons, active nav, hero icons)
- Light green    #7cc79a ; deep green #0c3b33 / #194a34 ; text #14231b ; muted #6a7b72 ; border #dfe6e2
- Accent amber #d99a2b / #c4851a (warnings, "approver" highlight); danger #d93a2f; info teal #0f6f7c
- Grade colours (used everywhere for scores): A "On track" green (80%+), B "Needs attention" amber (50%+),
  C "Support needed" red (0%+). Each grade has colorFrom / colorTo / colorText.
- Branch/section accent palette (cycled, one per section or team): green #1b6a43, teal #0f6f7c, amber #b9740f,
  rose #b9455f, indigo #4b55b8, slate-blue #4a6a8a. Each has a strong colour and a soft tint (e.g. #e3f3ea).

PAGE BACKGROUND (this is the glass "mesh")
- Fixed (background-attachment: fixed) stack of soft radial gradients over a pale green linear gradient:
  radial 900x560 at 8% -8% rgba(47,154,106,.34); radial 760x520 at 96% 6% rgba(214,181,92,.24);
  radial 900x640 at 80% 108% rgba(32,128,110,.28); radial 700x500 at 0% 100% rgba(124,199,154,.30);
  base linear-gradient(160deg,#eaf4ec,#f3f7ef 48%,#e4f1e9).
- Dark theme: base linear-gradient(160deg,#0a130e,#0f1b14 55%,#0b1712) with the same radials at lower opacity.

GLASS TOKENS (apply to every card, panel, topbar, sidebar, popover, input)
- --glass: rgba(255,255,255,.58); --glass-strong: rgba(255,255,255,.74); --glass-border: rgba(255,255,255,.7)
- backdrop-filter: blur(18px) saturate(1.5) on cards; blur(22px) saturate(1.6) on the sidebar; blur(16px) on the topbar
- border: 1px solid var(--glass-border)
- shadow: 0 10px 34px -12px rgba(18,72,46,.22), inset 0 1px 0 rgba(255,255,255,.6); on hover 0 14px 38px -12px rgba(18,72,46,.3)
- Dark: --glass rgba(24,40,31,.55), --glass-strong rgba(28,46,36,.72), border rgba(160,220,185,.12)
- Skip blur on very large scrolling surfaces (long forms/tables) for performance: use ~86% opaque surface instead.

SHAPE + SPACING
- Radii: cards 16-24px, buttons/inputs 12-14px, pills 99px, modals 22-24px, floating bars 20-26px.
- Cards have 16-24px padding, 12-16px gaps. Everything feels rounded and airy, never boxy.
- Sidebar and topbar are FLOATING glass panels inset 14px from the screen edges (not edge-to-edge).

LAYOUT
- Desktop: floating glass sidebar (260px, logo on top, nav, settings, profile card), sticky floating topbar
  (breadcrumb, theme toggle, install icon, notification bell with dot, profile chip + logout), content max ~1200px.
- Mobile (<=720px): sidebar disappears. Bottom FLOATING glass tab bar (left/right 12px, bottom 12px + safe-area,
  radius 26px, 5 items: icon over tiny label; the active tab is a green gradient pill with a small 3D bottom shadow).
  "More" opens an iOS-style bottom sheet (grab handle, rounded 22px top, grouped white rows with green rounded icon
  squares, chevrons, red "Sign out" row). Floating glass topbar, 58px, radius 20px.
- Filters on phones collapse into one row ("Filters - All members - 1 month") that expands to a 2-column grid.
- Tables become stacked cards on phones (each row = a card, each column = a labelled field, 16px inputs).
- Org chart on phones = accordion of coloured branch cards with a search box.

COMPONENTS
- Primary button: green gradient, white text, soft green drop shadow. Secondary: glass-strong with glass-border.
- Inputs: 46px tall, radius 13px, 1px #cdd9d2 border, white background, inner shadow, green focus ring
  (0 0 0 4px rgba(27,106,67,.14)); selects have a custom green chevron. Labels are small and bold.
- Tags / chips: pill, 11-12px bold, soft tint background + strong text of the same hue
  (Every day = amber, Weekly = green, Monthly = indigo, Target = rose, Status = teal, Approver = purple, Info = grey).
- Stat cards: icon + small caps label, big number (28-34px, 800), a bar, a small caption. Top edge has a thin green accent.
- Avatars: round, soft pastel backgrounds with initials; vacant seats use a dashed circle.
- Grade chip: outlined pill in the grade colour + an "eye" icon button that opens a sheet with every grade range.
- Dialogs: iOS-style alert (centered 300px card, blur backdrop, title, short text, two buttons separated by hairlines,
  destructive action in red) for confirms; sheets from the bottom on phones for anything bigger.
  Forms inside dialogs are grouped in tinted sections, each with a small green icon square + title + one-line hint.

3D PROGRESS BARS (everywhere a percentage is shown)
- Track = hatched trough: repeating-linear-gradient(135deg,#e4eae7 0 7px,#d3dcd8 7px 14px), inset shadow
  (0 3px 5px rgba(20,40,30,.30)), height 14px, fully rounded, with faint quarter marks at 25/50/75%.
- Fill = raised glossy bar in the grade colour gradient: inset white top highlight, inset dark bottom,
  small outer shadow, plus a translucent white gloss strip on the upper 40%. Vertical bars use cylinder shading
  (light left edge, dark right edge). So covered vs pending is readable from far away.

MOTION
- 150-300ms ease; cards pop in with translateY(12px) scale(.97) -> 1, staggered by 60-80ms; sheets slide up;
  alerts scale from 1.1. Respect prefers-reduced-motion.

LOGIN PAGE
- Split layout: left a large illustrated brand panel (logo, tagline, floating 3D-style insects that walk and get
  "sprayed" by a mist animation), right a glass card with email/password + "Continue with Google". Full-screen
  soft green gradient behind. On phones only the card remains with ambient insects behind it.

FIRST-TIME GUIDE
- Full-screen swipeable cards: rounded 28px card, left coloured gradient hero (big white icon tile, eyebrow label,
  title, subtitle, tags), right content (stat tiles / chips / numbered steps with description). Dots on top,
  Back / Next at the bottom, and a voice-over bar (play, Hindi/English toggle, caption, progress) that reads each card.

PWA
- Installable on Android, iOS and desktop: manifest (standalone, theme #1b6a43), maskable icons, service worker,
  install icon in the topbar, Web Push notifications.

TONE OF UI TEXT
- Short, friendly, plain English (optionally Hinglish in help). Title + one-line hint, never long paragraphs.
  Use tags and icons instead of sentences wherever possible.
```
