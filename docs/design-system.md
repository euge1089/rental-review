# Rent Review Boston - design system

This document mirrors the **home page** visual language so other routes stay consistent. Implementation lives in `src/app/globals.css` (CSS variables + utilities), `src/lib/ui-classes.ts` (shared Tailwind class strings), and `src/app/_components/app-page-shell.tsx` (layout primitives).

## Color tokens (`:root` / Tailwind theme)

| Token | Hex / role |
|--------|------------|
| **muted-blue** | `#5c6b7f` - nav labels, secondary text, links |
| **muted-blue-hover** | `#152a45` - headlines, emphasis, primary button hover |
| **muted-blue-soft** | `#7a8899` - tertiary |
| **muted-blue-tint** | `#eef1f5` - soft fills, hover chips |
| **pop** | `#db7837` - sparing accent (CTAs, highlights) |
| **pop-hover** | `#c56a2f` |
| **pop-tint** | `#fdf6f0` - hero glows only |
| **Accent teal / coral** | Reserved for illustrations / future use |

## Page canvas

- **App background:** `#f5f5f6` (`bg-[#f5f5f6]`) - set on the main content wrapper in root layout so every page matches the home shell.
- **Section band (neutral):** `#e4e9ef` - “How it works” style bands.
- **Dark marketing slab:** `muted-blue-hover` gradient stack - community CTA only.

## Typography

- **Page title:** `text-3xl font-semibold tracking-tight text-muted-blue-hover` (scale to `sm:text-4xl` on marketing-style pages).
- **Eyebrow / label:** `text-xs font-semibold uppercase tracking-[0.2em] text-muted-blue` (home) or `text-muted-blue-hover` on tinted sections.
- **Body:** `text-sm leading-relaxed text-zinc-600` (supporting copy).
- **Meta / captions:** `text-xs text-zinc-500`.

## Surfaces (cards & forms)

- **Elevated panel:** `rounded-3xl border border-zinc-100 bg-white shadow-elevated` with padding `p-6 sm:p-8` - primary content blocks, sign-in card, modals.
- **Subtle panel:** `rounded-2xl border border-zinc-200/80 bg-white` - nested sections, list tiles, profile sub-cards.
- **Inset / muted:** `rounded-2xl border border-muted-blue/20 bg-[#e4e9ef]/50` - optional callouts.

`shadow-elevated` is defined in `globals.css` (soft double shadow, no harsh black drop).

## Buttons

- **Primary:** `rounded-full bg-muted-blue px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgb(92_107_127/0.35)] transition hover:bg-muted-blue-hover`
- **Secondary (outline):** `rounded-full border border-zinc-200 bg-white font-semibold text-muted-blue-hover transition hover:border-muted-blue/30 hover:bg-muted-blue-tint/40`
- **Ghost / text:** `font-medium text-muted-blue hover:underline`

Reserve **pop** for high-intent moments (e.g. hero secondary emphasis), not every button.

## Form controls

- **Default input:** full width, `rounded-xl`, `border-zinc-200`, `bg-white`, focus `border-muted-blue/40` + `ring-2 ring-muted-blue/20` - see `formInputClass` in `ui-classes.ts`.
- **Compact (dense forms):** `formInputCompactClass` - same treatment, `h-10` + horizontal padding aligned to submit flow.

## Modals / overlays

- **Backdrop:** `bg-zinc-900/45 backdrop-blur-[2px]` (align with hero sign-up).
- **Dialog:** `rounded-3xl border border-zinc-100 bg-white shadow-elevated` - same as elevated panel.

## Spacing & width

- **Content column (full-width, home-aligned):** `max-w-[min(88rem,calc(100%-2rem))]` + `px-8 sm:px-12 xl:px-20` - shared by home `SectionMaxW`, `AppPageShell`, site header nav, and footer (`appContentMaxWidthClass` / `appContentPaddingXClass` in `ui-classes.ts`).
- **Narrow flows (e.g. sign-in):** same outer shell; an inner wrapper uses `max-w-xl` so the form stays readable.
- **Vertical rhythm:** `py-10 sm:py-12` on standard app pages; home uses its own section spacing.

## Motion

- Respect `prefers-reduced-motion` for scroll-into-view and decorative animation (see `home-hash-scroll` pattern).
- Marquee / drift animations are gated in CSS with `prefers-reduced-motion: no-preference`.

## Usage

1. Wrap route content in **`AppPageShell`** (pick `narrow` | `medium` | `wide` | `xwide`).
2. Use **`PageHeader`** for eyebrow + title + description.
3. Wrap major blocks in **`SurfacePanel`** (`elevated` vs `subtle`).
4. Reuse **`ui-classes`** for inputs and modals instead of one-off `border-zinc-300` styles.

When in doubt, match a home section: soft white cards on `#f5f5f6`, navy headlines, muted-blue UI chrome, minimal pop.
