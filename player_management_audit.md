# CrickIQ Player Management Flow Dependency Audit

## A. Current Player Management Architecture

The current architecture is decentralized. Players belong to `Team` arrays, and their lifecycle editing is distributed across three distinct modal/page experiences:
- **Manage Players (`TeamEditorModal`)**: Acts as a comprehensive list editor. It allows adding, editing (inline table inputs), deleting, and assigning Captain/Vice-Captain. Changes are held locally in component state and pushed to the global store via `updateTeam` when the user clicks "Save Changes".
- **Player Details (`PlayerDetailsPage`)**: Acts as a profile viewer that features an embedded "Edit" modal. It allows editing a single player's details, including checking and unchecking Captain/Vice-Captain statuses, then saving updates directly back to `updateTeam`.
- **Emergency Replacement (`ImpactPlayerModal`)**: A specialized wizard during live matches to substitute active players via `addPlayerReplacement` without mutating the standard `updateTeam` logic.

Editing a player's ID mutates their object in the specific `Team` array. Career stats depend on `globalPlayerId` spanning multiple copies of `player.id` across different teams. Therefore, edits only apply to the team instance currently loaded.

---

## B. Current Entry Points

1. **Quick Match Setup Page**
   - **Trigger:** "Manage Players" button
   - **Component:** Opens `TeamEditorModal` as a modal overlay.
2. **Match Manager Page / Tournament Setup**
   - **Trigger:** "Edit Team" button
   - **Component:** Opens `TeamEditorModal` holding the tournament team data.
3. **Team Details Page**
   - **Trigger:** "Edit Team" button
   - **Component:** Opens `TeamEditorModal`.
4. **Team Details Page (Player Roster List)**
   - **Trigger:** Clicking a player card
   - **Component:** Navigates to `PlayerDetailsPage` (full page overlay).
5. **Live Scoring**
   - **Trigger:** "Emergency Replacement" button (visible on locked rosters).
   - **Component:** Opens `ImpactPlayerModal`.

---

## C. Duplicate Logic Found

- **Edit & Save Logic:** Both `TeamEditorModal` and `PlayerDetailsPage` map over the `team.players` array to construct updated player objects, manually patch Captain/Vice-Captain constraints (e.g. unchecking vice-captain if made captain), and call `updateTeam`.
- **Validation Logic:** Both locations validate names, roles, and jersey numbers using `validatePlayer`. `TeamEditorModal` adds bulk team constraint checks (Wicket Keeper missing, Captain missing).
- **Lock Logic (`activeMatchForLock`):** Exactly duplicated across `TeamEditorModal.tsx` and `PlayerDetailsPage.tsx`. It calculates whether a team is involved in an active or completed match, toss taken, or abandoned, and blocks editing respectively.
- **Navigation Logic:** Returning to context is inconsistent. `TeamEditorModal` uses an `onClose` / `onDone` callback pattern. `PlayerDetailsPage` uses a pseudo-routing `onBack` callback function to pop itself off the screen.

---

## D. Risk Areas

Transforming to a single-view flow presents several structural risks:
1. **Match Engine & Toss Logic Checks:** The Toss modal requires two valid teams. If the `isKeeperMissing` or `isCaptainMissing` verifications are moved strictly to `PlayerDetailsPage`, then `QuickMatchSetup` won't know if the roster is legal for toss.
2. **Loss of Context State:** `QuickMatchSetup` currently relies on local `editingTeam` state to display the modal. If `PlayerDetailsPage` becomes route-like, the application state must safely hold `matchId` and `teamId` being edited without resetting the Setup screen.
3. **`globalPlayerId` Fracture:** If saving a player inside `PlayerDetailsPage` accidentally overwrites `globalPlayerId` or issues a fresh UUID, the career stats engine will permanently split history for that player across tournaments.
4. **Live Scoring Destabilization:** Removing `isEditingLocked` or altering team structures could allow rogue player edits mid-match, corrupting the `LiveScoring` ball logs, batsman/bowler pointers, and scorecard generation.

---

## E. Recommended Safe Transformation Plan

To shift to the future flow where `PlayerDetailsPage` is the ultimate editing source, follow this step-by-step phased approach:

1. **Extract Duplication:** Move the redundant `activeMatchForLock` lock checks into a reusable hook (e.g., `useTeamLock(teamId, tournamentId)`). Move Team Validation (Captain/Wicket-Keeper logic) into `utils/validation.ts`.
2. **Convert Manage Players to a Selector:** Strip `TeamEditorModal` of its inline table inputs. Convert it to a lightweight floating roster list with a clean "+ Add Player" button, and row clicks that trigger "Edit".
3. **Establish Return Routing:** Introduce a safe contextual payload mechanism (e.g., `setEditingPlayerState({ playerId, teamId, returnTo: 'QuickMatchSetup' })`) allowing `PlayerDetailsPage` to open, capture edits, and seamlessly unmount back to the caller.
4. **Wire Set Toss Activation:** Expose the extracted Team Validation hook to `QuickMatchSetup.tsx`. Bind the "Set Toss" button state tightly to valid output.
5. **Freeze Player Details:** Replace the internal modal inside `PlayerDetailsPage` by making the whole page an editable form structure.
6. **Protect Impacts:** Do not touch `ImpactPlayerModal`. Ensure Live Scoring maintains isolated power over `addPlayerReplacement`.

---

## F. Files That Need Changes Later

- `components/TeamEditorModal.tsx` (Complete redesign to list view)
- `components/PlayerDetailsPage.tsx` (Remove inner Edit modal, become primary form)
- `components/QuickMatchSetup.tsx` (Add Set Toss validation logic)
- `components/TeamDetailsPage.tsx` (Adjust prop routing)
- `components/MatchManager.tsx` (Adjust prop routing)

---

## G. Files That Must Not Be Touched

The core domain engines should be strictly bypassed during UI refactoring:
- **`components/LiveScoring.tsx`** (Core state machine)
- **`components/MatchScorecard.tsx`** (View engine)
- **`components/MatchOvers.tsx`** (View engine)
- **`components/ImpactPlayerModal.tsx`** (Emergency mutation)
- **`components/Statistics.tsx`** (Calculation engine)
- **`components/PointsTable.tsx`** (Tournament engine)
- **`hooks/useCrickIQState.tsx`** (Persistence and DB layer)
- **`utils/cricketLogic.tsx`** (Math and rules)
