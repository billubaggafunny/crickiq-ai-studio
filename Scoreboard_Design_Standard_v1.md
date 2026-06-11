# CrickIQ Scoreboard Design Standard v1

## 1. Scoreboard Purpose
The Scoreboard UI serves as the primary visual component for communicating match state, scores, and results across the CrickIQ application. It must provide immediate, glanceable information to the user without overwhelming them with secondary details.

## 2. Layout Hierarchy
1. **Match Status/Metadata:** Date, tournament info, match number, and status badge at the top.
2. **Team Scores (The Hero):** The central focus of the card. Team names and scores side-by-side or stacked, with the score taking visual precedence.
3. **Winner/Result Text:** Positioned below the scores to summarize the outcome.
4. **Actions:** Buttons or interactive elements at the bottom (e.g., "Score Card", "View Result").

## 3. Typography Hierarchy
- **Team Name:** `text-sm` or `text-base`, `font-semibold`, truncated (`truncate`) to handle long names. Do not make team names larger than the score values.
- **Score:** `text-lg` or `text-xl`, `font-mono`, `font-bold`. Must be the largest element in the score row.
- **Overs:** `text-xs` or `text-sm`, `font-mono`, muted color (`text-text-secondary`).
- **Metadata (Date/Location):** `text-[10px]` or `text-xs`, uppercase where useful, tracking wide.
- **Result Text:** `text-xs` or `text-sm`, `font-medium` or `font-semibold`.

## 4. Score Formatting Rules
- Scores must be formatted consistently (e.g., `150/4`).
- If a team has not batted, display "DNB" or "Yet to bat".
- Always use `font-mono` for score numbers to ensure consistent width and alignment.

## 5. Overs Formatting Rules
- Displayed next to or below the score.
- Example: `(20.0 ov)` or `20.0 Overs`.
- Use muted typography (`text-text-secondary`) to distinguish from the primary score.

## 6. Result Text Style
- Use existing wording from `resultFormatters.ts`. Ensure exact match.
- Should be readable in both light and dark themes.
- Do not use a large full-width heavy pill unless explicitly required by the screen. A simple `text-brand-blue` or `text-text-primary` with medium weight is preferred.

## 7. Status Badge Rules
- **LIVE:** Use a small red dot + "LIVE" text. **Strict rule:** NO pulsing animation (`animate-pulse`). Use a compact pill style.
- **COMPLETED:** Muted or brand-colored compact pill.
- **UPCOMING:** Gray/subtle pill.
- **DRAFT:** Orange/amber subtle pill indicating setup needed.
- **ABANDONED:** Red/gray subtle pill.
- **READY TO TOSS / READY TO START:** Blue/accent subtle pill.

## 8. Light Theme Rules
- Background: `bg-primary` or `bg-secondary`.
- Border: `border-brand-blue/15` or similar subtle border.
- Text: Primary text uses `text-text-primary`, supporting text uses `text-text-secondary`.
- Accent: Brand colors for interactive elements, without overwhelming the card.

## 9. Dark Theme Rules
- Background: `dark:bg-secondary` or dark card surface.
- Border: `dark:border-border` or `dark:border-white/10`.
- Text: High contrast `dark:text-text-primary` for scores, `dark:text-text-secondary` for metadata. Avoid faded/low-contrast grays.
- Keep the overall look crisp. Colors should remain readable and distinct.

## 10. Mobile Layout Rules
- Mobile-first approach. Cards should fit comfortably on small screens.
- Use flex-col or tight flex-row layouts to prevent text overflow.
- Ensure touch targets for actions are at least 44px.
- Truncate long team names (`truncate`, `max-w-[120px]` etc.) to prevent layout breaking.

## 11. Do / Don't Rules
- **DO:** Let whitespace separate content rather than hard divider lines.
- **DO:** Use the exact result string from `resultFormatters.ts`.
- **DO:** Support light and dark modes inherently by using theme variables.
- **DON'T:** Use fixed card heights. Allow content to dictate height.
- **DON'T:** Make the team name larger than the score.
- **DON'T:** Recalculate winners in the UI layer. Use the helpers.
- **DON'T:** Use `animate-pulse` for live markers.

## 12. Active Roadmap

### Phase A — Foundation ✅
- **A1** Score Rendering Audit
- **A2** Mini Scoreboard Audit
- **A3** Result Logic Audit
- **A4** `scoreFormatters.ts`
- **A5** `resultFormatters.ts` for QuickMatchHistory extraction
- **A6** Scoreboard Design Standard v1

### Phase B — Scoreboard Modernization
- **B1 MatchTable Scoreboard Upgrade ✅** (Actual first visible implementation)
- **B2 TeamDetailsHub Matches Tab**
- **B3 AnalyticsOverview**
- **B4 MatchDetailsHub Overview**
- **B5 Tournament Fixtures / Tournament Match Cards**
- **B6 Commentary Header**
- **B7 Tournament Live Widget**
- **B8 Live Scoring Header**

*(Note: The initial attempt on QuickMatchHistory.tsx was updated but discovered to be an orphaned component. It has been retained for now but is not considered the baseline visible implementation. MatchTable.tsx is the actual baseline/reference implementation. Scoreboard Design Standard v1 has been validated through MatchTable. A future orphaned component audit is required.)*
