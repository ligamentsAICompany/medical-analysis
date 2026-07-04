# Design.md — The LigaX Design System

> A portable, opinionated design system distilled from the **LigaX Land Acquisition Platform**.
> Engineered for dense, data-heavy B2B workspaces that still need to feel calm, premium, and exclusive.
>
> Use this document as the blueprint when you want to bring the same look-and-feel — typography,
> motion, theming, components, notifications, kanban — to another product.

---

## 0. The Philosophy

LigaX is an internal platform for Enterprise AI managing millions of dollars in
for Corporations who needs AI to run day to day business and there is no excuse for sloppy. The design system is built around three rules:

1. **Establish hierarchy without shouting.** Users skim before they read. Type weight, size, and rhythm guide the eye.
2. **Respect data density.** Numbers, fractions, IDs — everything aligns, nothing wastes pixels.
3. **Earn trust through consistency.** `$1,234,567.89` always looks identical; `0.0083333333` keeps its trailing zeros.

The aesthetic is **calm, confident, expert** — never chatty, never decorative-for-its-own-sake.
Visual delight is reserved for moments that earn it (drag-drop completion, KPI rollups, command palette open).

---

## 1. Stack at a glance

| Layer | Tool |
|---|---|
| Framework | Next.js (App Router, RSC) |
| Language | TypeScript `strict: true` |
| Styling | Tailwind CSS v4 (CSS-first tokens via `@theme`) |
| Theming | `next-themes` (cookie + localStorage, SSR-safe) |
| Motion | Framer Motion v12 (springs over easings) |
| Icons | `react-icons/pi` (Phosphor) — one family per visual unit |
| Tables | TanStack Table v8 |
| Charts | Recharts (deliberately lightweight) |
| Drag & drop | `@dnd-kit/core` (kanban, sortables) |
| Command palette | `cmdk` (Linear-style ⌘K) |
| Toast | Sonner (top-right, 4s) |
| Forms | React Hook Form + Zod |
| Fonts | `next/font/google` — Space Grotesk, Plus Jakarta Sans, Geist Mono |

---

## 2. Brand identity

### Wordmark
Two-tone, no logomark. Always rendered live in text (never an image) so it inherits theme:

```tsx
<span className="font-sans text-[22px] font-extrabold tracking-[-0.03em] text-foreground">
  LigaX
</span>
<span
  className="font-sans text-[22px] font-extrabold tracking-[-0.03em]"
  style={{ color: "var(--accent)" }}
>
  Ops
</span>
```

- Weight 800 (extrabold), tracking `-0.03em` for a tight, modern silhouette.
- Suffix (`Ops`, `Pay`, `CRM`, etc.) is in `--accent` — instant brand recognition without a separate file.

### Brand voice
- "Saved." / "Couldn't reach the server. Try again." → **yes**
- "Awesome! 🎉" / "Oops! Something went wrong!" → **no**
- No emoji in production UI. No exclamation points in error messages. Verb-first buttons.

---

## 3. Color system

All colors are **OKLCH** — perceptually uniform, future-proof, and looks identical bright on light
and dark backgrounds without manual tuning.

### Tokens

Tokens live as CSS custom properties on `:root` and `.dark`. Tailwind v4 `@theme inline` maps them
to utilities (`bg-background`, `text-foreground`, `border-border`, …).

**Light theme** — warm light gray page, white cards, near-black primary, vibrant green accent.

```css
:root {
  --background:           oklch(0.965 0.002 264);   /* warm light gray — page bg */
  --foreground:           oklch(0.09  0     0);     /* near-black text */
  --card:                 oklch(1     0     0);     /* white cards */
  --primary:              oklch(0.13  0     0);     /* near-black primary */
  --primary-foreground:   oklch(0.985 0     0);
  --secondary:            oklch(0.94  0     0);     /* light gray — secondary btns */
  --muted:                oklch(0.94  0     0);
  --muted-foreground:     oklch(0.52  0     0);
  --accent:               oklch(0.78  0.21  142);   /* vibrant lime green */
  --accent-foreground:    oklch(0.09  0     0);
  --destructive:          oklch(0.577 0.245 27.325);
  --border:               oklch(0.905 0     0);
  --input:                oklch(0.905 0     0);
  --ring:                 oklch(0.13  0     0);     /* near-black focus ring */

  --sidebar:              oklch(0.12  0     0);     /* very dark — for sidebar contrast */
  --sidebar-foreground:   oklch(0.88  0     0);
  --sidebar-muted:        oklch(0.35  0     0);

  --radius: 0.75rem;
}
```

**Dark theme** — same accent, deep neutrals, never pure black (`0.10` rather than `0.00`):

```css
.dark {
  --background:           oklch(0.10  0     0);
  --foreground:           oklch(0.945 0     0);
  --card:                 oklch(0.145 0     0);
  --primary:              oklch(0.92  0     0);
  --primary-foreground:   oklch(0.13  0     0);
  --secondary:            oklch(0.22  0     0);
  --muted-foreground:     oklch(0.60  0     0);
  --accent:               oklch(0.78  0.21  142);   /* same green — pops on dark */
  --border:               oklch(0.24  0     0);
  --ring:                 oklch(0.60  0     0);
  --sidebar:              oklch(0.08  0     0);
}
```

### Rules

- **NEVER hardcode hex** in components. Use Tailwind utilities or `var(--token)` only.
- **Status colors are locked**: `--accent` (success/highlight), `--destructive` (red), amber `#f59e0b` (warning dot only — never as a fill).
- **Accent is rationed.** Reserved for: primary CTAs, unread-notification bars, brand suffix, high-value rows, current-stage indicators. If everything is accented, nothing is.
- **Dark mode parity is mandatory** — every component must read correctly in both. Verify contrast 4.5:1 body, 3:1 UI.

### Radius scale

`--radius: 0.75rem` (12px) is the base; everything else derives from it via `calc`.

```css
--radius-xs:  calc(var(--radius) - 6px);   /* 6px  — pills, badges */
--radius-sm:  calc(var(--radius) - 4px);   /* 8px  — small buttons */
--radius-md:  calc(var(--radius) - 2px);   /* 10px — inputs */
--radius-lg:  var(--radius);               /* 12px — buttons, panels */
--radius-xl:  calc(var(--radius) + 4px);   /* 16px — cards */
--radius-2xl: calc(var(--radius) + 8px);   /* 20px — modals, command palette */
```

---

## 4. Typography — the foundation

The single most distinctive part of the system. Three fonts, three roles, **never mixed within a single visual unit beyond a 2-of-3 combination**.

### The trio

| Font | Role | Why |
|---|---|---|
| **Space Grotesk** (`--font-display`) | Page titles, KPI labels, eyebrow labels | Architectural confidence. Slightly condensed forms; distinctive `g`, `a`, `&` give a recognizable fingerprint that doesn't age into "trendy". |
| **Plus Jakarta Sans** (`--font-sans`) | All UI, body, forms, nav, table cells | Humanist enough to feel approachable, geometric enough to feel professional. Crisp at 12px on retina. ~80% of every screen. |
| **Geist Mono** (`--font-mono`) | Money, decimals, fractions, IDs, dates-in-tables | Tabular by default. Slashed zero. Designed for data density. |

### Loading via `next/font/google`

```ts
import { Geist_Mono, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});
```

Then in `@theme inline`:

```css
--font-display: var(--font-space-grotesk),     ui-sans-serif, system-ui, sans-serif;
--font-sans:    var(--font-plus-jakarta-sans), ui-sans-serif, system-ui, sans-serif;
--font-mono:    var(--font-geist-mono),        ui-monospace, "Cascadia Code", monospace;
```

### Base styles

```css
body {
  font-family: var(--font-sans);
  font-size: 0.9375rem;          /* 15px — body-md */
  line-height: 1.6;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-feature-settings: "kern" 1, "ss01" 1;
  letter-spacing: -0.02em;
}

code, kbd, pre, samp,
[data-numeric],
.tabular-nums {
  font-family: var(--font-mono);
  font-feature-settings: "tnum" 1, "zero" 1;
}
```

### The signature patterns

These three patterns appear on **every screen** and define the look:

**1. Eyebrow → KPI hero (dashboards)**
```tsx
<p className="font-sans text-[9.5px] font-bold uppercase tracking-[0.25em] text-foreground/55">
  Pipeline Value
</p>
<p className="font-display text-[38px] font-black leading-none tracking-[-0.04em] text-foreground">
  $4.2M
</p>
```
Bold uppercase letter-spaced eyebrow (Plus Jakarta) above a heavy display number (Space Grotesk).

**2. Breadcrumb → page title (every page header)**
```tsx
<p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-foreground/35 mb-4">
  Home · Dashboard
</p>
<h1 className="font-display text-[34px] font-black text-foreground leading-none tracking-[-0.04em]">
  Overview
</h1>
```

**3. Tabular numerics (every table cell with numbers)**
```tsx
<span className="font-mono text-[11px] tabular-nums text-foreground/40">
  102.40
</span>
```
`tabular-nums` (`font-feature-settings: "tnum" 1`) makes every digit the same width — columns align perfectly without `text-align: right` hacks.

### Hard rules

- Decimal interests preserve full 10-digit precision — never truncate trailing zeros (`0.0083333330`).
- Money via a shared `<MoneyValue />` (`$` prefix, two decimals always).
- Fractions via `<FractionInput />` / `<FractionValue />` (numerator/denominator, decimal computed live).
- No arbitrary sizes (`text-[14px]` everywhere is fine; `text-[13.7px]` once is not).
- Never stack 3 fonts in one visual unit — display + text **or** text + mono.

---

## 5. Iconography

We use **`react-icons`** as a meta-library — 30+ icon families behind a single dependency with proper per-family tree-shaking. The "vast library" only works with discipline:

### Primary family — Phosphor (`react-icons/pi`)

The default for **all** general UI. Same geometric/humanist DNA as Plus Jakarta + Space Grotesk.

```tsx
import { PiFolderOpen, PiMapTrifold, PiWarningCircle } from "react-icons/pi";
```

- 9,000+ icons across 6 weights (`thin`, `light`, `regular`, `bold`, `fill`, `duotone`).
- Use `regular` (no suffix) for ≥90% of UI.
- Use `bold` (e.g. `PiBellBold`) only in dense headers, status pills, or icon-only buttons where it must read at 13–17 px.
- `fill` only for active/selected states. `duotone` only in empty-state illustrations.

### Approved supplements (when Phosphor doesn't have it)

| Family | Import | Use case |
|---|---|---|
| Simple Icons | `react-icons/si` | **Brand logos only** — Microsoft, Mapbox, GitHub |
| Tabler | `react-icons/tb` | Domain-specific gaps (drill rig, oil pump variants, Mdeical or telecom domain) |
| Heroicons v2 | `react-icons/hi2` | Last-resort for ubiquitous concepts Phosphor + Tabler both miss |

### Banned families

Font Awesome (`fa`), Material (`md`), Ionicons (`io`/`io5`), Ant (`ai`), Bootstrap (`bs`), Remix (`ri`), Lucide (`lu`). All clash with the stroke/weight of our type system.

### Hard rules

1. **Always import from the specific subfolder** (`react-icons/pi`) — root import (`react-icons`) ships every family.
2. **One family per visual unit** — a card, a row, a section header.
3. **Inherit from text color** via `currentColor`. No raw hex on icons. Use `text-foreground/40`, `text-accent`, `text-destructive` for status.
4. **`aria-hidden="true"`** on decorative icons; **`aria-label`** on icon-only buttons.
5. **Sizes are locked**:

| Token | px | Use |
|---|---|---|
| `size-3.5` | 14 | Inline with `body-sm`, KBD chips |
| `size-4`   | 16 | **Default** — inline with `body-md`, secondary buttons |
| `size-5`   | 20 | Primary buttons, sidebar nav, status indicators |
| `size-6`   | 24 | Page headers, large CTAs |
| `size-8`   | 32 | Empty states, file-type indicators |
| `size-12`  | 48 | Hero empty-state illustrations only |

Never use arbitrary sizes (`size-[18px]`).

### `<Icon />` wrapper

Enforce all rules through one tiny component:

```tsx
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
const sizeMap: Record<Size, string> = {
  xs: "size-3.5", sm: "size-4", md: "size-5",
  lg: "size-6",   xl: "size-8",
};

export function Icon({
  icon: I,
  size = "sm",
  className,
  label,
}: { icon: IconType; size?: Size; className?: string; label?: string }) {
  return (
    <I
      className={cn(sizeMap[size], "shrink-0", className)}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    />
  );
}
```

---

## 6. Spacing & density

Tailwind spacing scale only — no arbitrary values.

| Context | Token |
|---|---|
| Page padding (mobile) | `px-6 py-4` |
| Page padding (desktop) | `px-8 py-6` |
| Card padding (compact) | `p-4` |
| Card padding (comfortable) | `p-6` |
| Form field gap | `space-y-4` |
| Section gap | `space-y-8` |
| Card grid gap | `gap-2.5` (dense) / `gap-4` (default) |

**Density modes**:
- **Compact** — dashboards, tables, lists (default for data screens).
- **Comfortable** — forms, detail pages, settings.

---

## 7. Motion — springs over easings

LigaX uses Framer Motion **springs** as the default. Springs interrupt cleanly when the cursor or selection moves mid-flight — easings restart abruptly and feel cheap.

### The four canonical springs

These four configs power every animated element in the app. Memorize them; never invent new ones.

```ts
/* Hover pill — slightly over-damped so fast mouse sweeps redirect cleanly */
const SPRING_HOVER  = { type: "spring", stiffness: 350, damping: 38 } as const;

/* Active selection — crisp snap to new position */
const SPRING_ACTIVE = { type: "spring", stiffness: 300, damping: 30 } as const;

/* Side panels (notifications, AI drawer) — heavier feel */
const PANEL_SPRING  = { type: "spring", stiffness: 320, damping: 38 } as const;

/* Dropdown / modal pop-in — punchy with slight overshoot */
const POP_SPRING    = { type: "spring", stiffness: 500, damping: 40, mass: 0.8 } as const;
```

### Easings — only when motion is purely linear

For progress bars, area fills, and one-shot reveals where springiness would feel wrong:

```ts
ease: [0.16, 1, 0.3, 1]   /* expo-out — classic "decelerate" curve */
```

### Duration ceiling

- Default enter: **200 ms**.
- Default exit: **150 ms**.
- Maximum allowed: **400 ms** (feels slow on every repeat).
- Page transition: 200 ms Framer Motion fade+slide.

### Always

- Respect `prefers-reduced-motion` — all transitions become 0.01s; no parallax.
- Stagger lists by **30–50 ms per item**, max 8 items, then fall off.

### Never

- Bounce / elastic / overshoot easings — unprofessional for B2B.
- Spinners on data screens. Skeletons only. Spinners only for: button-during-mutation, file upload, modal-pending.
- Animations > 400 ms.

### The "persistent pill" pattern (signature)

The same trick powers the sidebar hover state, top nav, tab nav, theme toggle, and notifications hover. **One** persistent `motion.div` is animated to the target rectangle — never mounted/unmounted per item.

```tsx
const [pill, setPill] = useState({ x: 0, w: 0, visible: false });

const handleEnter = (id: string, el: HTMLButtonElement) => {
  const cRect = containerRef.current!.getBoundingClientRect();
  const bRect = el.getBoundingClientRect();
  setPill({ x: bRect.left - cRect.left, w: bRect.width, visible: true });
};

<motion.div
  aria-hidden
  className="pointer-events-none absolute top-1 bottom-1 z-0 rounded-full bg-secondary"
  animate={{ x: pill.x, width: pill.w, opacity: pill.visible ? 1 : 0 }}
  transition={SPRING_HOVER}
/>
```

Because the pill never unmounts, sweeping the cursor across 10 items produces **one** continuous spring rather than 10 mount/unmount janks. This is *the* detail that makes the nav feel premium.

### Selection that "teleports" (signature)

For active-state pills that should slide *between* selected items (tabs, sidebar active state):

```tsx
{active && (
  <motion.div
    layoutId="dashboard-tab"            /* shared id across all tab buttons */
    className="absolute inset-0 rounded-full bg-foreground shadow-sm"
    transition={SPRING_ACTIVE}
  />
)}
```

`layoutId` makes Framer Motion treat moves between siblings as a single physical pill teleporting through space — no fade-out/fade-in.

### Load animations

- **Skeleton shimmer** matching the final layout shape (no spinner on data screens, ever).
- **Charts**: Recharts `isAnimationActive={true}`, `animationDuration={800}`, `animationEasing="ease-out"` — area sweeps in from left.
- **Progress bars**: width animates from 0 to target with `[0.16, 1, 0.3, 1]` expo-out and a 200ms delay so the user sees the rise:

```tsx
<motion.div
  className="h-full rounded-full"
  style={{ background: "var(--accent)" }}
  initial={{ width: 0 }}
  animate={{ width: `${pct}%` }}
  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
/>
```

- **Cards in a grid**: optional stagger fade-in (`delay: i * 0.03`, 12 ms total max for 4 items).
- **Sidebar/panel slide-in**: spring on `x` from `100%` (right drawer) or `-250` (left drawer).

---

## 8. Component layer

### 8.1 App shell

A fixed top bar + collapsible sidebar with portal-rendered panels:

```
TopBar              z-40 — fixed top-0, height 60px
Sidebar             z-30 — fixed top-[60px], width 232↔60px
Shell content              — handles responsive ml shift
Notifications       z-50 — right drawer
AI Drawer           z-50 — right drawer
Tasks Panel         z-61
Modals / Dialogs    z-80
Command Palette     z-81 — highest layer
```

The sidebar animates between **232 px (expanded)** and **60 px (collapsed)** on desktop, and between
0 ↔ off-screen with a translate-X on mobile. Single `motion.aside` with `animate={asideAnimate}` —
no separate components for the two states.

### 8.2 Sidebar

The premium feel comes from three details:

1. **One persistent hover pill per section** — measures `<li>` rect on `onMouseEnter` and animates a single `motion.div`'s `y` + `height` to it. Fast mouse sweeps look continuous, never flickery.
2. **`layoutId="nav-active"`** — the active-section pill teleports through space when you click a new item.
3. **Icon micro-bounce** — `whileHover={{ scale: 1.08 }}` with `SPRING_ICON = { stiffness: 400, damping: 17 }`.

Sections are titled with a tiny eyebrow: `text-[10px] font-semibold uppercase tracking-[0.13em] text-foreground/40`. Badges (e.g. "12 work orders") sit right-aligned in `font-mono text-[10px] tabular-nums`.

Collapsed state shows tooltips on hover via `AnimatePresence` — anchored to `left-full` with `ml-3`.

### 8.3 Top bar

Two-tone wordmark (left), then a row of `9 × 9` icon buttons (right):
- ⌘K search (opens command palette)
- O&G glossary
- My tasks (with badge)
- Notifications (with badge)
- User menu

All icon buttons share the exact same chrome:
```tsx
className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground
           transition-colors hover:bg-card hover:text-foreground"
```

Badges sit absolute-positioned in the upper-right with a `ring-2 ring-background` so they "punch out" of the icon button cleanly:
```tsx
<span
  className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center
             rounded-full px-[3px] font-mono text-[9px] font-bold text-white ring-2 ring-background"
  style={{ background: "var(--accent)" }}
>
  {count > 99 ? "99+" : count}
</span>
```

### 8.4 Tabs (`<TabNav />`)

A segmented control with two pills:
- **Active pill** — `bg-foreground` (high contrast) with `layoutId` so it slides between selections.
- **Hover pill** — `bg-secondary`, single persistent element animating `x` + `width` with `SPRING_HOVER`.

Hover pill suppresses itself when hovering the already-active tab (`opacity: pill.visible && hoveredId !== activeId ? 1 : 0`). This avoids "double pill" artifacts.

The tab itself is borderless — only the background fills indicate state. Active text becomes `text-background`; inactive is `text-foreground/70`.

### 8.5 Cards

The visual unit of the platform. Every card follows the same recipe:

```tsx
<div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
  {/* header */}
  <div className="px-5 pt-5 pb-4">
    <Eyebrow>Pipeline Value</Eyebrow>
    <p className="font-display text-[38px] font-black leading-none tracking-[-0.04em]">$4.2M</p>
  </div>

  {/* divider — always 1px, always border/50 */}
  <div className="h-px bg-border/50" />

  {/* row */}
  <div className="flex items-center justify-between px-5 py-4">
    <Eyebrow>Invoiced</Eyebrow>
    <span className="font-display text-[16px] font-bold tracking-[-0.02em]">$2.8M</span>
  </div>
</div>
```

Notable choices:
- `rounded-2xl` (16 px) — large enough to feel modern, small enough to not look "consumer".
- `border-border/50` — borders at 50 % opacity feel softer than `border-border` while staying visible in both themes.
- `overflow-hidden` lets sparklines and progress bars bleed to the card edge.

### 8.6 Tables

TanStack Table v8 with a custom `<DataTable />` wrapper.

- Sticky header (top) and optionally sticky first column.
- Zebra rows — `bg-muted/30` on odd rows. Subtle.
- Density toggle (compact / cozy).
- Faceted filters in a side rail or top bar.
- All numerics: `font-mono num-md tabular-nums`.
- Inline editing where appropriate (double-click → edit, Esc → cancel).
- Bulk-action toolbar appears on row selection.
- Empty / loading / error states all defined.
- Virtualize when > 100 rows (TanStack Virtual).
- Column resize + reorder, **saved per user**.
- Export menu: CSV / XLSX / JSON.

### 8.7 Forms

- React Hook Form + Zod resolver.
- **Validation on blur** (not on every keystroke).
- Inline error message under field, red text, persists until corrected.
- **Required fields marked with `*`** (not just red border).
- **Labels always visible** — never placeholder-only.
- Autosave indicator on long forms ("Saved 3s ago").
- Specialized inputs are mandatory:
  - `<MoneyInput>` — `$` prefix, two-decimal enforcement, paste-friendly (strips `$,`).
  - `<FractionInput>` — numerator + denominator inputs, computes decimal live, validates ≤ 1.
  - `<DateInput>` — keyboard navigable, parses common formats.
- Submit buttons disabled while invalid; loading state during submission.
- Multi-step forms: progress indicator + back button + save-draft.

### 8.8 Buttons

Three shapes only:

```tsx
/* Primary */
className="rounded-lg bg-foreground text-background px-4 py-2 text-[13px] font-semibold
           hover:bg-foreground/90 transition-colors"

/* Secondary */
className="rounded-lg bg-secondary text-foreground px-4 py-2 text-[13px] font-medium
           hover:bg-secondary/80 transition-colors"

/* Ghost / icon button */
className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground
           transition-colors hover:bg-card hover:text-foreground"
```

Press feedback: `whileTap={{ scale: 0.97 }}` with the spring `{ stiffness: 380, damping: 30 }`.

### 8.9 Dialogs

Radix `<Dialog />` (shadcn variant). Mandatory:
- Focus trap.
- Esc closes.
- Click-outside closes (unless destructive).
- Return focus to trigger on close.
- Confirmation dialogs for destructive actions on important data require **typing the resource name** to confirm.

### 8.10 Toast (Sonner)

- Position: **top-right**.
- Default duration: **4 s**, dismissible.
- Variants: `success` / `error` / `warning` / `info`.
- Use for: transient feedback ("Saved", "Permit synced").
- Do **not** use for: critical errors needing acknowledgment (use modal), persistent state (use banner).

```tsx
toast.success(`${woId} moved to ${STAGE_LABELS[newStage]}.`, {
  description: "Created 2 follow-up tasks.",
  duration: 3500,
});
```

---

## 9. The Notifications System (signature feature)

A right-side drawer that's calm, scannable, and respects density.

### Anatomy

```
┌──────────────────────────────────────┐
│ Notifications [12]      ✓✓ Mark all ✕│  ← header, accent badge for count
├──────────────────────────────────────┤
│ TODAY                                │  ← group label, eyebrow style
├──────────────────────────────────────┤
│ ┃ ▣ Permit issued        2h ago      │  ← unread bar (left, accent)
│   33-00843 — Antero — Harrison       │     icon, title, time
│   Decimal interest: 0.00833333       │     mono detail row
│   → View permit                      │     CTA link
├──────────────────────────────────────┤
│   ⚠ Variance flagged    5h ago  ⊙    │  ← high-priority amber dot
│   ...                                │
├──────────────────────────────────────┤
│ ⚙ Notification settings              │  ← footer
└──────────────────────────────────────┘
```

### Implementation details

**1. Right-slide drawer with backdrop**
```tsx
<motion.div
  key="notif-panel"
  initial={{ x: "100%" }}
  animate={{ x: 0 }}
  exit={{ x: "100%" }}
  transition={PANEL_SPRING}                                /* stiffness 320, damping 38 */
  className="fixed right-0 top-0 bottom-0 z-[61] flex flex-col bg-background border-l border-border/60"
  style={{ width: "min(400px, 100vw)", boxShadow: "-8px 0 32px rgba(0,0,0,0.08)" }}
/>
```

**2. Grouped by relative time** — `TODAY`, `YESTERDAY`, `THIS WEEK`, `EARLIER`. Group label is a tiny eyebrow with a 1 % background tint:
```tsx
<div className="px-5 py-2 border-b border-border/40" style={{ background: "rgba(0,0,0,0.018)" }}>
  <span className="font-sans text-[10px] font-bold tracking-[0.14em] text-foreground/30">
    {label}
  </span>
</div>
```

**3. Unread accent bar** — 3 px wide, accent-colored, on the left edge of unread rows:
```tsx
{!notif.read && (
  <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ background: "var(--accent)" }} />
)}
```

**4. High-priority amber dot** — only for `variance_flagged`, `task_overdue`, `migration_failed`:
```tsx
{isHigh && !notif.read && (
  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: "#f59e0b" }} />
)}
```

**5. Neutral icons** — every notification kind uses a neutral `bg-secondary` chip with `text-foreground/45`. The system intentionally avoids per-kind colors — the unread bar and the amber dot are the only color signals. Reduces noise dramatically.

**6. Persistent hover pill inside the list** — same pattern as the sidebar:
```tsx
<motion.div
  aria-hidden
  className="pointer-events-none absolute inset-x-0 top-0 z-0 bg-secondary/70"
  animate={{ y: pill.y, height: pill.h, opacity: pill.visible ? 1 : 0 }}
  transition={SPRING_HOVER}
/>
```

**7. Marks-as-read on hover** — `onMouseEnter` triggers `markRead(notif.id)`. Encourages scanning without explicit clicks.

**8. Dismiss appears on hover only** — `hidden group-hover:flex`. Clean by default, action when needed.

**9. Empty state** — never a blank panel. Always a centered icon + warm message + (sometimes) CTA:
```tsx
<div className="flex flex-col items-center py-20 px-8">
  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
    <PiChecksBold size={20} className="text-foreground/25" />
  </div>
  <p className="font-sans text-[14px] font-semibold text-foreground/50">All caught up</p>
  <p className="mt-1 font-sans text-[12px] text-foreground/30">No notifications right now.</p>
</div>
```

---

## 10. Command Palette (`cmdk`)

Linear-style `⌘K` global palette. The single most polished surface in the app.

### Open animation

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.96, y: -12 }}
  animate={{ opacity: 1, scale: 1,    y: 0   }}
  exit   ={{ opacity: 0, scale: 0.97, y: -8  }}
  transition={POP_SPRING}                          /* stiffness 500, damping 40, mass 0.8 */
/>
```

Backdrop fades in with `backdropFilter: blur(6px)` and `rgba(0,0,0,0.55)`.

### Panel chrome

- `rounded-2xl` (20 px), white-translucent (`rgba(255,255,255,0.97)`).
- `boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)"` — drop shadow + hairline border + inset highlight, all in one shadow stack. This is what gives it the "floating glass" feel.
- 640 px wide, 72vh max height, positioned at `top-[12vh]`.

### Features

- **Smart prefix detection** — `#` for files, `@` for owners, `>` for actions, `:` for navigate, `P2021-...` for work orders.
- **Hint chips** below input (when empty) suggest the prefix syntax with the prefix in `--accent`.
- **Grouped results** — files, work orders, owners, permits, acquisitions, division orders, actions. Each group has a small accent-colored kind label.
- **Per-kind accent badges** — files (blue), WOs (amber), owners (purple), permits (pink), acquisitions (green), DOs (cyan). The only place in the app where multi-color is allowed.
- **Recent items** persisted to `localStorage` (`MAX_RECENT = 5`).
- **`layoutId="cmdk-active"`** for the active-row background — slides between rows on arrow keys.
- **Footer with key hints** — `↑ ↓ navigate`, `↵ open`, `⌘ ↵ new tab`, `esc close`. Always visible.

### Keyboard

- `ArrowUp` / `ArrowDown` — navigate.
- `Enter` — open. `⌘ + Enter` / `Ctrl + Enter` — open in new tab.
- `Esc` — close.
- Auto-scrolls active row into view (`scrollIntoView({ block: "nearest" })`).

---

## 11. Kanban Board

Powered by `@dnd-kit/core`. The signature workflow surface for Work Orders.

### Layout

```
┌────────────┬────────────┬────────────┬─── … ───┬───┐
│ INITIATION │ OFFER OUT  │ AGREEMENT  │ CLOSING │ ⊙ │  ← columns
│      6     │     12     │      8     │    4    │ 2 │  ← count per column
├────────────┼────────────┼────────────┼─────────┼───┤
│ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │         │   │
│ │ Card   │ │ │ Card   │ │ │ Card   │ │         │   │
│ └────────┘ │ └────────┘ │ └────────┘ │         │   │
│ ┌────────┐ │ ...        │ ...        │         │   │
└────────────┴────────────┴────────────┴─────────┴───┘
```

### Column

- Width: `w-[232px]` expanded, `w-10` collapsed (matches sidebar width — visual rhythm).
- Header: `rounded-t-xl border border-b-0 border-border/60 bg-card`.
- Title: `font-sans text-[11px] font-semibold uppercase tracking-widest text-foreground/50`.
- Count: `font-mono text-[11px] tabular-nums text-foreground/35`.
- Body: `rounded-b-xl border border-t-0 border-border/60 p-2 bg-muted/20`.
- When dragging over: `bg-secondary/60` (subtle highlight, no green flash).
- `closed` column collapses to icon-only by default (the only "noise reducer" column).

### Card

The LigaX kanban card has a very specific 4-row anatomy:

```tsx
<div className="rounded-xl border bg-card p-3.5 cursor-grab select-none border-border/60
                hover:border-border hover:shadow-sm transition-all duration-100">

  {/* Row 1 — P# + assignee initials avatar */}
  <div className="flex items-center justify-between gap-2">
    <Link className="font-mono text-[11px] tabular-nums text-foreground/40 hover:text-foreground">
      P2021-066
    </Link>
    <div className="w-5 h-5 rounded-full bg-foreground/8 border border-border/50">
      <span className="text-[9px] font-bold text-foreground/50">CJ</span>
    </div>
  </div>

  {/* Row 2 — Seller name (the title) */}
  <p className="mt-1.5 font-sans text-[13px] font-semibold leading-snug truncate">
    Wilson Family LLC
  </p>

  {/* Row 3 — County · NMA (mono) */}
  <p className="mt-0.5 font-sans text-[11.5px] text-foreground/40 truncate">
    17 Harrison · <span className="font-mono tabular-nums">102.40</span> NMA
  </p>

  {/* Row 4 — Stage age + value, separated by a thin top border */}
  <div className="mt-2.5 pt-2.5 border-t border-border/30 flex items-center justify-between">
    <span className="font-mono text-[10.5px] tabular-nums text-foreground/30">14d</span>
    <span className="font-mono text-[11px] tabular-nums text-foreground/70">$185k</span>
  </div>
</div>
```

Overdue cards (days > stage SLA) get a `<PiWarningBold />` next to the day count and the text bumps from `text-foreground/30` to `text-foreground/60` — never red. Calm signal, not alarm.

### Drag & drop

- `MouseSensor` requires `distance: 5` (prevents accidental drags on click).
- `TouchSensor` requires `delay: 200, tolerance: 5`.
- `DragOverlay` renders a clone with `shadow-xl ring-1 ring-border/40`.
- Original card during drag: `opacity-30` placeholder.
- Drop animation: `{ duration: 180, easing: "ease-out" }`.
- On drop, toast a confirmation with the new stage name + side effect summary ("Created 2 follow-up tasks").

### Card list animation

When a card moves between columns, the receiving column reflows with Framer Motion `layout`:

```tsx
<motion.div
  key={wo.id}
  layout
  initial={{ opacity: 0, y: 4 }}
  animate={{ opacity: 1, y: 0 }}
  exit   ={{ opacity: 0 }}
  transition={{ duration: 0.12 }}
/>
```

---

## 12. Settings / Config Page

The settings page is the platform's "calmest" surface. Goal: discoverable, scannable, never busy.

### Layout

Two-column on `lg:` and above, single-column below.

```
┌──────────────┬─────────────────────────────────────────────┐
│ SETTINGS     │ Appearance                                   │
│ ─────────    │ ─────────────────────────────────────────── │
│ • General    │ Theme                          ┌──┬──┬────┐ │
│ • Appearance │ Choose your preferred theme.   │ ☀│ 🌙│ ⎕ │ │
│ • Notifs     │                                └──┴──┴────┘ │
│ • Security   │                                             │
│ • Integrations│ ─────────────────────────────────────────── │
│ • Audit Log  │ Density                                     │
│              │ Compact for data-heavy screens.    [Compact]│
│              │                                             │
│              │ ─────────────────────────────────────────── │
│              │ Language                              [EN ▾]│
└──────────────┴─────────────────────────────────────────────┘
```

### Left rail

Sticky section nav. Items are vertical tabs with the same `<TabNav />` mechanic (single hover pill,
single active pill with `layoutId`). Reuses the platform's nav grammar — no new component invented.

### Section anatomy

Each section is a `rounded-2xl border border-border/50 bg-card` card. Inside, every row is:

```tsx
<div className="px-6 py-5 flex items-start justify-between gap-6 border-b border-border/40 last:border-0">
  <div className="flex-1 min-w-0">
    <p className="font-sans text-[13.5px] font-semibold text-foreground">Theme</p>
    <p className="mt-1 font-sans text-[12.5px] text-foreground/50 max-w-[420px]">
      Choose your preferred theme. System matches your OS setting.
    </p>
  </div>
  <div className="shrink-0">
    {/* control on the right */}
  </div>
</div>
```

The `max-w-[420px]` on the description prevents text from crowding the control — a small detail that makes every settings page feel breathable.

### The 3-way theme toggle (signature control)

A segmented pill with a sliding active background. Lives in the user menu *and* on the settings page:

```tsx
<div className="relative flex items-center rounded-2xl p-1 bg-muted">
  {/* Sliding active pill */}
  <motion.div
    className="pointer-events-none absolute top-1 bottom-1 z-0 rounded-xl bg-card"
    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}
    animate={{ x: pillStyle.x, width: pillStyle.w }}
    transition={SPRING_PILL}                                /* stiffness 380, damping 34 */
  />
  {THEME_OPTIONS.map((o) => (
    <button key={o.value} onClick={() => setTheme(o.value)} className="relative z-10 ...">
      <o.Icon size={13} />
      {o.label}
    </button>
  ))}
</div>
```

Why it feels great:
- The active background is a **card-colored pill** inside a `bg-muted` track. Inversion creates depth without a border.
- A tiny `boxShadow: 0 1px 4px` on the pill makes it feel *physically lifted* off the track.
- The pill slides between positions with a single `SPRING_PILL`, never fades in/out.

### Notification settings

Every notification kind (`permit_issued`, `wo_stage`, etc.) gets a row with three toggles: **In-app**, **Email**, **SMS**. Toggles are 28 × 16 px Radix Switch primitives, themed to use `--accent` when on.

### Account / Integrations / Audit

- Account: profile photo (upload via drag-drop), name, email (read-only from SSO), role badge.
- Integrations: list of connected services (Microsoft 365, Mapbox, WV DEP) with status pill + "Configure" action.
- Audit Log: filterable TanStack Table — actor, timestamp, action, diff. Diff in a side drawer (JSON viewer).

---

## 13. Charts

### Recharts — kept deliberately light

- One `<TrendAreaChart>` for time-series.
- One `<HorizontalBarChart>` for categorical breakdowns.
- One `<Sparkline>` for in-card mini trends.

### The signature sparkline

Three trend colors only (`up`, `down`, `neutral`):

```ts
const COLOR = {
  up:      "#1a8060",   /* deep mineral green */
  down:    "#e05252",   /* warm red */
  neutral: "#8b9cb6",   /* cool gray */
};
```

Below the line, a gradient fades from `stopOpacity={0.18}` to `0` — gives the sparkline a soft "water level" feel without being noisy. Lives in `MetricCard` full-bleed (no horizontal padding) so it visually anchors the KPI value.

### Animation

- `isAnimationActive={true}`, `animationDuration={800}`, `animationEasing="ease-out"`.
- Area sweeps in from the left on first render.
- No animation on hover / tooltip — those should be instant.

### Color discipline

Charts never use the brand `--accent` directly. That's reserved for UI signal. Charts use the trend palette above (`#1a8060`, `#e05252`, `#8b9cb6`) and for categorical, a neutral 6-step gray ramp. **Never a rainbow.**

---

## 14. Accessibility (WCAG 2.1 AA — non-negotiable)

- **Color contrast** verified: 4.5:1 body, 3:1 large text, 3:1 UI components. OKLCH makes this trivial to audit.
- **Keyboard navigation** — every interactive element reachable; visible focus ring (`focus-visible:ring-2 ring-ring`).
- **Skip links** — "Skip to main content" first-tabstop on every page.
- **Screen reader**
  - Semantic HTML (`<nav>`, `<main>`, `<aside>`, `<header>`).
  - `aria-label` on icon-only buttons (descriptive, action-oriented: `aria-label="Delete file"`, not `"trash"`).
  - `aria-live="polite"` on toast region.
  - `role="status"` on loading skeletons.
- **Forms** — every input has a `<label>`; errors associated via `aria-describedby`.
- **Tables** — `<caption>` or `aria-label`, `<th scope="col|row">`, no presentational tables.
- **Tested on** VoiceOver (Safari), NVDA (Firefox/Chrome) for critical journeys.
- **Linter** — `eslint-plugin-jsx-a11y` with `recommended` ruleset, CI-enforced.

---

## 15. Responsive

| Breakpoint | Width | Targets |
|---|---|---|
| (default / mobile) | < 640 px | iPhone |
| `sm:` | ≥ 640 px | Large phones |
| `md:` | ≥ 768 px | iPad portrait |
| `lg:` | ≥ 1024 px | iPad landscape, laptops |
| `xl:` | ≥ 1280 px | Desktop |
| `2xl:` | ≥ 1536 px | Large desktop |

- Every Tier-1 screen (dashboard, files list, file detail, work orders) must work at `md:` and above.
- Critical paths (file detail, ownership, search, notifications) must work at mobile.
- Sidebar collapses to a drawer below `md:`.
- Tables horizontally scroll within their container at `< md:`; never overflow page.

---

## 16. Performance UX

- **Optimistic UI** — mutations update UI immediately, revert on error with toast.
- **No layout shift on data load** — skeleton matches final layout dimensions; CLS = 0.
- **Debounce** search/filter inputs at 300 ms.
- **Virtualize** any list/table > 100 items (TanStack Virtual).
- **Preload** Next.js `<Link prefetch>` on hover; explicit `router.prefetch()` for critical paths.
- **Image optimization** — `next/image`, specify dimensions, lazy below fold.
- **Bundle** — monitor `next build` size; alert on +20 % growth.

### Budgets

| Metric | Budget |
|---|---|
| Cold initial page load | < 2 s (P75 on 3G Fast) |
| Authenticated page navigation | < 300 ms |
| Search query (universal) | < 500 ms P95 |
| API endpoint P95 | < 200 ms |

---

## 17. The per-screen polish checklist

Before merging any new screen, verify:

- [ ] **Empty state** with primary CTA
- [ ] **Loading skeleton** matching layout (no spinner)
- [ ] **Error state** with retry + actionable message in plain language
- [ ] **Light + dark mode** both look correct
- [ ] **Mobile (< 640 px)** is at least readable; tablet (≥ 768 px) functional
- [ ] **Keyboard navigable** — Tab through every action; Esc closes modals
- [ ] **Screen-reader labels** on icon-only buttons + dynamic regions
- [ ] **No layout shift** (CLS = 0) on data load
- [ ] **Optimistic UI** on mutations
- [ ] **Focus returns to trigger** after dialog close
- [ ] **Page transition** ≤ 200 ms
- [ ] **Reduced-motion** respected
- [ ] **Semantic HTML** (no `<div onclick>`)
- [ ] **Form inputs have visible labels** (no placeholder-as-label)
- [ ] **Money / fraction / date** inputs use shared components
- [ ] **⌘K reachable** if it's a navigable surface

---

## 18. What makes it feel exclusive

If you take only seven things from this document and apply them to a new platform, take these.
They are the highest-leverage details that turn a "decent UI" into one that feels premium.

1. **OKLCH tokens, never hex** — perceptual uniformity across light/dark is the foundation.
2. **The font trio** (Space Grotesk + Plus Jakarta Sans + Geist Mono) with the eyebrow → KPI hero pattern.
3. **`tabular-nums` on every number, everywhere** — columns align without alignment hacks.
4. **Persistent hover pills** with a single `motion.div` per surface, springs `stiffness 350 / damping 38`.
5. **`layoutId` for selection** — active pills teleport between siblings instead of fade-out/in.
6. **Skeletons, never spinners** on data screens. Spinners only for in-flight mutations.
7. **Accent is rationed** — one color, used for ≤ 5 % of pixels, becomes a brand signal instead of decoration.

Get those right, and you have LigaX. Get them wrong, and even the best layout looks generic.

---

## 19. File map (for adoption)

If you're porting this system to a new repo, here's what to copy first:

```
app/globals.css                              # OKLCH tokens, @theme inline, base styles
app/layout.tsx                               # next/font setup + ThemeProvider

components/shared/sidebar.tsx                # persistent hover-pill nav
components/shared/top-bar.tsx                # icon-button + badge chrome
components/shared/tab-nav.tsx                # segmented control with layoutId pill
components/shared/user-menu.tsx              # dropdown + 3-way theme toggle
components/shared/notifications-panel.tsx    # right-drawer pattern
components/shared/command-palette.tsx        # ⌘K with prefix routing + recents
components/shared/ai-button.tsx              # gradient-border conic-spinner button

components/ui/icon.tsx                       # the <Icon /> wrapper for react-icons/pi
components/charts/sparkline.tsx              # gradient-fill area sparkline

app/(platform)/work-orders/_components/
  kanban-view.tsx                            # @dnd-kit setup + drag overlay
  kanban-column.tsx                          # column with collapse
  wo-card.tsx                                # the 4-row card anatomy

TYPOGRAPHY.md                                # full type scale + numeric treatment
```

Pair this `Design.md` with `TYPOGRAPHY.md` — together they cover the entire surface.

---

*LigaX Design System — Enterprise AI portable to any data-heavy B2B product or AI Platform.
Calm, confident, expert. Every pixel earns its place.*
