# CrickIQ Internal Audit Report

## 1. Executive Summary
This report analyzes the design consistency, typography, and color systems in CrickIQ after recent readability improvements. It identifies all active design tokens, hardcoded colors, and inconsistencies across all components and layers.

## 2. Typography Inventory
### Global Fonts
- **Inter** (Primary, Google Font, wght@400-900)
- **LatiniaBlack** (Local Display Font, TTF)
- **SharpCardinal** (Local Display Font, TTF)

### Typography Scale (Tailwind Tokens)
- h1, h2, h3, body, caption, button, tab, table-header, table-cell, table-secondary, form-label, form-input, form-error, status

## 3. Color Inventory
### CSS Custom Variables
- Light Mode: `--color-primary` (#FFFFFF), `--color-secondary` (#F8F6FD), `--color-text-primary` (#111827), `--color-text-secondary` (rgba(0,0,0,0.65)), `--color-highlight` (#EF4444), `--color-accent` (#2563EB), `--color-brand-blue` (#4338CA), `--color-success` (#15803D), `--color-warning` (#B45309), `--color-danger` (#B91C1C).
- Dark Mode equivalents.

## 4. Token Inventory
The application uses classes resolving to Tailwind theme extensions:
- Text: `text-text-primary`, `text-text-secondary`, `text-brand-blue`, `text-white`, `text-accent`.
- Background: `bg-primary`, `bg-secondary`, `bg-brand-blue`, `bg-highlight`, `bg-accent`.

## 5 & 6. Component-by-Component & Page Audit
### AnalyticsOverview
- **Typography/Color Options**: text-sm, text-text-secondary, text-h1, text-text-primary, text-white, text-[10px], text-white/90, text-xl, text-xs, text-white/80, text-caption, text-success, text-green-400, text-6xl, text-3xl
- **Backgrounds**: bg-white/20, bg-white/5, bg-black/10, bg-success/100/10, bg-black/20, bg-white/30, bg-black/5, bg-white/10, bg-white, bg-black/30, bg-brand-blue/10, bg-brand-blue, bg-brand-blue/90, bg-indigo-500/5, bg-white/60

### AnalyticsWorkspace
- **Typography/Color Options**: text-body, text-brand-blue, text-white, text-text-secondary, text-text-primary
- **Backgrounds**: bg-white/10, bg-black/10, bg-white, bg-secondary, bg-white/5

### Calendar
- **Typography/Color Options**: text-h3, text-text-primary
- **Backgrounds**: bg-primary/80

### Comparison
- **Typography/Color Options**: text-h3, text-table-header, text-text-secondary, text-text-primary, text-black, text-md, text-body, text-gray-600, text-gray-400, text-xs, text-button
- **Backgrounds**: bg-white, bg-primary/50, bg-black/20, bg-gray-300, bg-gray-700, bg-secondary/50, bg-black/10

### ComparisonBarChart
- **Typography/Color Options**: text-button, text-white, text-body, text-text-primary, text-h3
- **Backgrounds**: bg-primary

### ConfirmationModal
- **Typography/Color Options**: text-h2, text-gray-900, text-white, text-gray-700, text-gray-300, text-body, text-gray-800, text-gray-200
- **Backgrounds**: bg-black, bg-opacity-75, bg-black/5, bg-white/10, bg-black/10, bg-white/20

### Drawer
- **Typography/Color Options**: text-danger, text-h2, text-text-primary, text-text-secondary, text-xs, text-h3, text-body, text-success, text-brand-blue, text-white, text-caption, text-3xl, text-yellow-100, text-warning, text-[10px]
- **Backgrounds**: bg-primary, bg-white/20, bg-black/30, bg-danger/20, bg-red-900/30, bg-primary/50, bg-black/20, bg-white, bg-black/40, bg-success/20, bg-green-900/30, bg-brand-blue/20, bg-blue-900/30, bg-brand-blue/100, bg-brand-gradient

### DynamicNotificationBar
- **Typography/Color Options**: text-green-400, text-red-400, text-blue-400, text-body
### Header
- **Typography/Color Options**: text-white, text-2xl, text-h1
- **Backgrounds**: bg-brand-gradient, bg-white/20

### Home
- **Typography/Color Options**: text-base, text-lg, text-text-secondary, text-gray-800, text-white, text-caption
- **Backgrounds**: bg-white, bg-gray-50, bg-brand-gradient

### HowToUseGuide
- **Typography/Color Options**: text-h2, text-text-primary, text-text-secondary, text-h3, text-white, text-caption
- **Backgrounds**: bg-brand-blue

### LineupPreview
- **Typography/Color Options**: text-button, text-white, text-body, text-caption, text-text-secondary, text-text-primary, text-warning, text-slate-600
- **Backgrounds**: bg-primary/50, bg-secondary/70, bg-black/20, bg-warning/100/20, bg-gray-500/20

### LiveScoring
- **Typography/Color Options**: text-sm, text-text-secondary, text-text-primary, text-caption, text-body, text-brand-blue, text-h3, text-button, text-white, text-xs, text-h2, text-base, text-5xl, text-md, text-table-header
- **Backgrounds**: bg-secondary/80, bg-primary/50, bg-white/30, bg-black/20, bg-black/5, bg-white/5, bg-primary/30, bg-secondary/90, bg-highlight, bg-brand-blue/10, bg-gray-500, bg-teal-400, bg-danger/100, bg-slate-400, bg-red-600

### MatchManager
- **Typography/Color Options**: text-body, text-text-secondary, text-white, text-h2, text-base, text-text-primary, text-2xl, text-text-secondary/80, text-h3, text-[10px], text-danger, text-teal-600, text-warning, text-brand-blue, text-gray-600
- **Backgrounds**: bg-primary/50, bg-black/20, bg-primary/20, bg-danger/20, bg-red-900/30, bg-red-400, bg-danger/100, bg-teal-100, bg-teal-900/30, bg-warning/20, bg-brand-blue/20, bg-blue-900/30, bg-primary, bg-gray-300, bg-gray-700

### MatchScorecard
- **Typography/Color Options**: text-h2, text-slate-800, text-text-primary, text-button, text-white, text-body, text-2xl, text-brand-blue, text-base, text-text-secondary, text-sm, text-h3, text-slate-700, text-caption, text-[10px]
- **Backgrounds**: bg-white/30, bg-black/20, bg-primary/50, bg-warning/20, bg-brand-blue/20, bg-blue-900/30, bg-brand-lavender/20, bg-brand-lavender/30, bg-teal-100, bg-teal-900/30, bg-success/20, bg-green-900/30, bg-secondary, bg-white/20, bg-brand-blue/10

### PlayerStatsModal
- **Typography/Color Options**: text-sm, text-text-secondary, text-body, text-text-primary, text-h2, text-button, text-white, text-[10px], text-slate-600, text-3xl, text-h3, text-base
- **Backgrounds**: bg-primary, bg-black, bg-opacity-75, bg-secondary, bg-brand-blue, bg-opacity-90

### PointsTable
- **Typography/Color Options**: text-text-secondary, text-black, text-body, text-button, text-white, text-caption, text-brand-blue
- **Backgrounds**: bg-primary/50, bg-white

### QuickMatchHistory
- **Typography/Color Options**: text-text-secondary, text-h3, text-text-primary, text-caption, text-button, text-white, text-sm, text-body, text-brand-blue
- **Backgrounds**: bg-black/10, bg-black/5, bg-white/5, bg-white/20, bg-brand-blue/10

### QuickMatchResults
- **Typography/Color Options**: text-text-primary, text-body, text-lg, text-[10px], text-xs, text-white/90, text-slate-600, text-xl, text-button, text-white, text-[11px], text-caption, text-sm, text-text-secondary, text-2xl
- **Backgrounds**: bg-secondary, bg-white/20, bg-black, bg-opacity-75, bg-black/50, bg-primary, bg-border-color, bg-blue-600, bg-warning/100

### QuickMatchSetup
- **Typography/Color Options**: text-h2, text-text-primary, text-button, text-white, text-body, text-sm, text-text-secondary, text-2xl, text-highlight, text-gray-600, text-gray-400, text-[10px], text-h3, text-3xl
- **Backgrounds**: bg-highlight/10, bg-primary/80, bg-primary, bg-brand-blue, bg-gray-300, bg-gray-700, bg-brand-gradient, bg-black, bg-opacity-75

### QuickMatchStats
- **Typography/Color Options**: text-text-secondary, text-h3, text-text-primary, text-button, text-white, text-body, text-base, text-sm, text-3xl, text-brand-teal, text-brand-lightblue, text-h2, text-caption, text-[8px], text-brand-blue
- **Backgrounds**: bg-white, bg-black/20

### Rankings
- **Typography/Color Options**: text-[10px], text-button, text-white, text-table-header, text-text-secondary, text-xl, text-xs, text-sm, text-text-primary, text-[9px], text-text-secondary/70, text-caption, text-text-secondary/30, text-brand-blue, text-white/90
- **Backgrounds**: bg-success/100, bg-danger/100, bg-gray-500, bg-black/10, bg-white/5, bg-black/5, bg-white/20, bg-black/60, bg-white, bg-secondary, bg-black/20, bg-black/40, bg-brand-blue, bg-white/10, bg-brand-blue/10/50

### ScheduleGenerator
- **Typography/Color Options**: text-h1, text-text-primary, text-h3, text-black, text-table-header, text-text-secondary, text-caption, text-highlight, text-body, text-sm
- **Backgrounds**: bg-white, bg-primary/50, bg-highlight/10

### SettingsModal
- **Typography/Color Options**: text-h3, text-text-primary, text-body, text-xs, text-highlight, text-lg, text-brand-blue, text-sm, text-text-secondary, text-caption, text-white, text-gray-600, text-gray-400, text-danger, text-[10px]
- **Backgrounds**: bg-black, bg-opacity-75, bg-primary/50, bg-primary, bg-brand-blue, bg-brand-blue/90, bg-gray-300, bg-gray-700, bg-danger/10, bg-primary/30, bg-white, bg-black/20

### Statistics
- **Typography/Color Options**: text-body, text-white, text-black, text-text-secondary, text-text-secondary/50, text-brand-blue, text-h3, text-text-primary, text-button, text-base, text-sm, text-3xl, text-caption, text-h2, text-brand-lavender
- **Backgrounds**: bg-primary/50, bg-brand-blue, bg-white, bg-black/20, bg-black/5, bg-white/5

### TeamEditorModal
- **Typography/Color Options**: text-sm, text-button, text-white, text-h3, text-h1, text-text-secondary, text-text-primary, text-yellow-800, text-yellow-300, text-body, text-highlight, text-gray-600, text-gray-400, text-xs
- **Backgrounds**: bg-black, bg-opacity-70, bg-gray-100, bg-gray-800, bg-warning/20, bg-gray-200, bg-gray-900/75, bg-white, bg-highlight/10, bg-gray-300, bg-gray-700, bg-primary/80, bg-primary

### TimeScroller
- **Typography/Color Options**: text-h3, text-text-primary, text-text-secondary
- **Backgrounds**: bg-white, bg-gray-800, bg-gray-100, bg-black/20

### TossModal
- **Typography/Color Options**: text-h2, text-text-primary, text-caption, text-text-secondary, text-white, text-[10px], text-button
- **Backgrounds**: bg-black/70, bg-primary, bg-black/30, bg-brand-blue, bg-white, bg-border-color

### TournamentList
- **Typography/Color Options**: text-body, text-text-secondary, text-text-primary, text-h3, text-black, text-caption, text-white, text-h2, text-sm, text-gray-600, text-gray-400, text-button, text-highlight
- **Backgrounds**: bg-white, bg-secondary, bg-brand-gradient, bg-black/20, bg-black/40, bg-gray-300, bg-gray-700, bg-black, bg-opacity-75, bg-primary, bg-border-color, bg-brand-blue, bg-opacity-90

### TournamentManager
- **Typography/Color Options**: text-h3, text-text-primary, text-xs, text-success, text-body, text-text-secondary, text-3xl, text-brand-blue, text-sm, text-highlight, text-warning, text-yellow-800, text-yellow-200, text-yellow-700, text-yellow-300
- **Backgrounds**: bg-success/20, bg-green-900/30, bg-primary/50, bg-warning/20/50, bg-warning/20, bg-white, bg-gray-700, bg-primary, bg-gray-600, bg-primary/30

### TournamentStats
- **Typography/Color Options**: text-text-secondary, text-caption, text-white, text-h3, text-text-primary, text-[10px], text-brand-blue, text-button, text-sm, text-success, text-danger, text-lg, text-blue-700, text-blue-400, text-text-secondary/50
- **Backgrounds**: bg-brand-blue, bg-white/10, bg-black/20, bg-black/5, bg-white/5, bg-brand-blue/20, bg-success/100, bg-danger/100, bg-gray-500, bg-brand-blue/10/50, bg-blue-900/10, bg-warning/10

### TransitionLockOverlay
- **Typography/Color Options**: text-white, text-2xl, text-button, text-white/90
- **Backgrounds**: bg-black/40

### WagonWheelModal
- **Typography/Color Options**: text-base, text-text-secondary, text-h2, text-white, text-h3, text-xs, text-black, text-body, text-brand-blue, text-text-primary
- **Backgrounds**: bg-black/20, bg-black/70, bg-zinc-600, bg-white/10, bg-white/20, bg-black/50

## 7. Popup & Modal Audit
Modals and dialogs (like `TeamEditorModal`, `SettingsModal`, `WagonWheelModal`, `PlayerStatsModal`) predominantly use `bg-white dark:bg-secondary` with `border-brand-blue/15`. Backdrop overlays are typically `bg-black/50`.

## 8. Layer Hierarchy Audit
- **Layer 0 (App BGs)**: `bg-secondary` / `dark:bg-secondary`
- **Layer 1 (Containers)**: `bg-primary/50`, `bg-white/5`
- **Layer 2 (Cards)**: `glass-card` / `bg-white dark:bg-black/30`
- **Layer 3 (Modals)**: `bg-white dark:bg-secondary`

## 9. Design-System Violations & Inconsistencies
- We observed inline arbitrary values like `bg-[#FFFFFF]` or `dark:bg-[#1a1a2e]` that were recently migrated out.
- A few hardcoded `text-gray-600` or `text-slate-800` exist outside of semantic text-secondary bindings.
- Remaining non-semantic Tailwind defaults like `bg-yellow-300`, `bg-blue-300`, `text-amber-800`, which should be aliased to warning/info.

## 10. Duplicate Style Report
- Multiple `text-white/80`, `text-white/90` used arbitrarily instead of a standard secondary text color token for dark themes.
- Redundant use of `text-xs` and `text-[10px]` while semantic `text-caption` and `text-status` exist.

## 11. Hardcoded Style Report
- Font sizes: `text-[10px]`, `text-[11px]`, `text-[13px]`, `text-[14px]`
- Hard colors: `bg-red-600`, `bg-blue-600`, `bg-gray-700` still sporadically present in specific state conditions (e.g. `disabled:bg-gray-300`).

## 12. Unused Token Report
- `brand-teal`, `brand-lightblue`, and `brand-lavender` are mapped in `tailwind.config` but their usage dropped significantly after color normalization to semantic success/warning/danger tags.
- `accent-light` is rarely referenced.

## 13. Recommendations
1. **Consolidate Pixel Fonts**: Migrate `text-[10px]` to a semantic `text-micro` scale mapped natively.
2. **Standardize Disabled States**: Extract `disabled:opacity-60 disabled:bg-gray-300 ...` to a unified `button-disabled` semantic class.
3. **Deprecate Unused Brands**: Trim the Tailwind config of unused custom hex maps if they aren't utilized in visualizations.
4. **Enforce Glass Cards**: Ensure all floating surfaces use the base `glass-card` class rather than manually recreating it with `bg-white/95 backdrop-blur`.
