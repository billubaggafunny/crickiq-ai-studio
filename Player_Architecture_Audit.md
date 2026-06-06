# CrickIQ Player Entity & Navigation Architecture Audit

## A. Executive Summary
This audit provides a deep architectural inspection of the Player entity lifecycle, storage, navigation patterns, and UI/UX state within the CrickIQ app. The system separates the **Team Pool** from the **Match Squad**, meaning player identity has a reasonably stable foundation. However, there are significant typing gaps (e.g., missing properties in `types.ts`) and data safety risks (e.g., cascading deletion issues affecting historical scorecards). 

## B. Player Entity Structure Findings
Inspected `types.ts` -> `Player` interface:
* **id** (string): Required. Stable entity reference used across the app and in match references.
* **originalId** (string): Optional. 
* **globalPlayerId** (string): Optional. Currently auto-assigned to match `id` upon creation, acting as a mirror rather than true global unification.
* **number** / **jerseyNumber** (number): Required. Jersey number.
* **name** (string): Required.
* **role** (PlayerRole): Required. Enum (Batsman, Bowler, All-Rounder, Wicket Keeper).

**Critical Gaps Found in Typings**:
* `addPlayerToTeam` accepts `battingStyle`, `bowlingStyle`, and `isWicketKeeper`, but these fields are **NOT DEFINED** in the `Player` interface in `types.ts`. These fields are being attached dynamically and silently ignored by the type checker.

## C. Player Storage Architecture
* **Location**: Players are tightly scoped to the `Team` object (`team.players` array).
* **Global Entity vs Local**: Player is fundamentally a **team-scoped entity** (Level 2 maturity). There is no standalone `globalPlayers` table. The `globalPlayerId` logic currently just duplicates the team-scoped ID.
* **Stable Identity**: Player identity is stable within the team. Changing a player's name updates their name in all historical matches because matches dynamically look up the player via `playerId` from the parent team pool.

## D. Player Creation Paths
1. **Component**: `AddPlayerSheet.tsx` → `useTeamState.addPlayerToTeam` (Generates `player_${uuid}`).
2. **Component**: `QuickMatchSetup.tsx` -> `useTournamentState.addPlayer` (Generates `p_${uuid}`).
3. **Component**: `PlayerDetailsPage.tsx` (Mode: `add`) (Generates raw `crypto.randomUUID()`).

**Findings**: ID generation is slightly inconsistent (`p_` vs `player_` vs raw UUID) but functionally works. Adds are appended directly to the parent team roster.

## E. Player Editing Paths
1. **Component**: `PlayerDetailsPage.tsx` -> `handleSave`.
**Findings**: Replaces the explicit player object inside `team.players`. Edits update the team roster immediately. Because `Match` records reference the player logically by `id`, changes to data like name/role immediately update rendering in historical matches (live updates without migration). 

## F. Player Visibility Map
* **Team Hub**: Fully read/write display of team roster.
* **Match Hub**: Displays read-only Player Lineups based on Match Squad subsets.
* **Quick Match / Tournament**: Players are selected into subsets for Toss/Match. 
* **Scorecards & Innings**: Renders by mapping `batsmanId`/`bowlerId` to the parent `team.players` pool.

## G. Player Details Navigation Flow
Guided by `PlayerNavigationContext.tsx`.
* **Payload**: `sourceScreen`, `teamId`, `playerId`, `returnTo` target.
* **Routing safety**: Solid. Allows safe push into `PlayerDetailsPage` and popping back to the previous screen without losing application state memory (e.g., Toss setup).

## H. Quick Match Player Flow
* Users select a pre-existing Global Team or temporary Team.
* Available players come directly from `team.players`.
* Uses `team1SquadIds`/`team2SquadIds` to select the specific match lineup.
* Unselected players act as substitutes/bench automatically.

## I. Tournament Player Flow
* Teams are added to the tournament via `addTeamToTournament`.
* **Finding**: `Tournament` records a `teamIds` reference list. It **does not copy/clone** the team. Tournaments mutate the absolute Global Team roster.

## J. Team Pool vs Match Squad Findings
* **Are team pools separate from match squads?** Yes! The architecture correctly uses `team1SquadIds` inside the `Match` object.
* **Is Live Scoring squad-aware?** Yes, live scoring only displays the `team1SquadIds` subset during the Toss and Over configurations.
* **Editing teams mid-match:** Modifying the team roster while a match is live does not break the match as long as active `SquadIds` remain in the team.

## K. Captain / Vice Captain / Wicketkeeper Findings
* **Captain / VC**: Stored rigidly on the `Team.captainId` and `Team.viceCaptainId` strings.
* **Wicketkeeper**: Stored ambiguously. The UI maps `role === 'Wicket Keeper'` as the primary Wicketkeeper validation, but UI checkboxes independently toggle `isWicketKeeper`.

## L. Player Data Safety Risks
* **Data Deletion Risk**: If a `Player` is deleted from the team roster via `deletePlayer`, past matches linked to `playerId` will crash or render "Unknown Player". **Priority**: High. Deletion eligibility logic is currently on the Team level, but missing on individual Players.
* **Duplicate Identity Mapping**: Modifying a team roster during an active tournament modifies the roster for previous Tournament matches as well.

## M. Player UI/UX Findings
* **Add Player**: Good UI parity with Add Team following recent standardizations.
* **Player Details Page**: Comprehensive, stat-rich, but visually dense. Needs mobile hierarchy passes.

## N. Architecture Maturity Rating
**Level 2 — Players are team-scoped with stable IDs.**
Players have stable IDs for look-ups, and the Squad vs Pool separation is excellent. However, a true global persistence graph mapping players across multiple teams does not exist yet. 

## O. Recommendations (Priority Order)

**Must Fix Now (Critical Issues)**
* Add `battingStyle`, `bowlingStyle`, `isWicketKeeper` strictly to `/types.ts` `Player` interface. These are currently untyped overrides.
* Block player deletion (`deletePlayer`) if their ID is present in *any* completed or live match scorecard. Must implement soft-deletion.

**Should Fix Soon (UX / Architecture Refinements)**
* Unify Player Creation schemas: Ensure all paths create using `generateEntityId()` and default to identical ID prefixes.
* Move Captain/Vice Captain away from the mutable `Team` root and store it on the specific `Match` squad instance so historical matches don't unexpectedly lose their 'Captain' if team leadership changes next season.

**Good Later**
* Refactor `globalPlayerId` to act as a definitive relational anchor, mapping a single logical person to multiple unique `TeamPlayer` profiles.

## P. Final Verdict
⚠️ **Player system is functional but needs refinement.**
The core squad separation provides robust structural integrity down to the live-scoring engine. The system is fundamentally stable, but data-leakage via typings and the absence of deletion-blocking validation represent high-priority technical debt.
