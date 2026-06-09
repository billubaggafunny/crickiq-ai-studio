import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-10 last:mb-0">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary mb-4 pb-2 border-b border-brand-blue/15">{title}</h3>
        <div className="space-y-4 text-text-secondary leading-relaxed">{children}</div>
    </div>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-6 pl-4 border-l-2 border-brand-blue/50">
        <h4 className="text-xl font-bold text-text-primary mb-4">{title}</h4>
        <div className="space-y-4">{children}</div>
    </div>
);

const Step: React.FC<{ num: number; children: React.ReactNode }> = ({ num, children }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-brand-blue text-white font-bold rounded-full text-caption mt-1 shadow-sm">{num}</div>
        <p className="text-text-primary">{children}</p>
    </div>
);

const RulePoint: React.FC<{ children: React.ReactNode; type: 'good' | 'bad' }> = ({ children, type }) => {
    const isBad = type === 'bad';
    const baseClasses = "flex items-start gap-4 p-4 rounded-lg";
    const colorClasses = isBad
        ? "bg-danger/20 border-l-4 border-red-500 text-red-900 dark:bg-red-900/30 dark:border-red-600 dark:text-red-200"
        : "bg-success/20 border-l-4 border-green-500 text-green-900 dark:bg-green-900/30 dark:border-green-600 dark:text-green-200";
    const icon = isBad ? '!' : '✓';
    const iconContainerClasses = `flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-white font-bold text-body mt-0.5 ${isBad ? 'bg-danger/100' : 'bg-success/100'}`;

    return (
        <div className={`${baseClasses} ${colorClasses}`}>
            <div className={iconContainerClasses}>
                {icon}
            </div>
            <p className="font-medium flex-1">{children}</p>
        </div>
    );
};


const HowToUseGuide: React.FC = () => {
    return (
        <div>
            <Section title="Quick Match">
                <p>For fast, single matches without the structure of a tournament. Perfect for a casual game.</p>
                <SubSection title="How to Start">
                    <Step num={1}>Navigate to the <strong>Home</strong> tab and select the <strong>Quick Matches</strong> view.</Step>
                    <Step num={2}>Enter names for Team 1 and Team 2, the number of overs, and players per team.</Step>
                    <Step num={3}>Click <strong>Setup & Start</strong>. This takes you to the setup screen.</Step>
                    <Step num={4}>On the setup screen, click <strong>Manage Players</strong> for each team to edit player names, numbers, roles, and assign a Captain (C) and Vice-Captain (VC).</Step>
                    <Step num={5}>Once a team's lineup is complete and valid, it will be marked as <strong>Ready</strong>.</Step>
                    <Step num={6}>When both teams are ready, click <strong>Set Toss</strong>, choose the winner and their decision, and confirm.</Step>
                    <Step num={7}>Click <strong>Start Match</strong> to begin scoring!</Step>
                </SubSection>
            </Section>

            <Section title="Tournaments">
                <p>Create and manage multi-team competitions with schedules, points tables, and detailed stats.</p>
                <SubSection title="Creating a Tournament">
                     <Step num={1}>Go to the <strong>Home</strong> tab and select the <strong>Tournaments</strong> view.</Step>
                     <Step num={2}>Fill in the tournament name, location, dates, default overs, and players per team.</Step>
                     <Step num={3}>Click <strong>Create</strong>. You'll be taken to the main Tournaments list.</Step>
                </SubSection>
                <SubSection title="Managing a Tournament">
                     <Step num={1}>From the <strong>Tournaments</strong> tab, find your tournament and click <strong>Manage Tournament</strong>.</Step>
                     <Step num={2}>Use the tabs at the top: <strong>Teams</strong> to add/edit teams and players, <strong>Fixtures</strong> to create matches between ready teams, <strong>History</strong> to view completed matches, and <strong>Stats</strong> for leaderboards.</Step>
                     <p><strong>Note:</strong> A team is only "Ready" for scheduling once it has the correct number of players, a designated Captain, Vice-Captain, and at least one Wicket Keeper.</p>
                </SubSection>
                <SubSection title="Tournament Fixtures">
                    <p>This powerful tool automates fixture generation. Find it in the <strong>Fixtures</strong> tab of your tournament workspace.</p>
                    
                    <h5 className="font-bold text-text-primary mt-6">Round Robin Scheduling (League Format)</h5>
                    <p>In this format, every team plays every other team once. It's best for finding the most consistent team over a series of matches.</p>
                    <Step num={1}>Select your tournament and choose the <strong>Round Robin</strong> format.</Step>
                    <Step num={2}>Set your schedule preferences: start date, matches per day, and which days of the week to play on.</Step>
                    <Step num={3}>Click <strong>Generate Preview</strong> to see the full list of generated matches.</Step>
                    <Step num={4}>If you're happy with the preview, click <strong>Add Matches to Tournament</strong> to finalize the schedule.</Step>
                    <p><strong>Automation:</strong> Once all Round Robin matches are completed, the app will analyze the <strong>Points Table</strong> and automatically schedule the <strong>Final</strong> between the top two teams.</p>
                    
                    <h5 className="font-bold text-text-primary mt-6">Knockout Scheduling (Elimination Format)</h5>
                    <p>This is a high-stakes "win or go home" format where the loser of each match is eliminated.</p>
                    <Step num={1}>Select your tournament and choose the <strong>Knockout</strong> format.</Step>
                    <Step num={2}>Set your schedule preferences (start date, etc.).</Step>
                    <Step num={3}>Click <strong>Generate Preview</strong>. The scheduler will only generate the <strong>first round</strong> of matches (e.g., Quarter-Finals).</Step>
                    <Step num={4}>Click <strong>Add Matches to Tournament</strong>.</Step>
                    <p><strong>Automation:</strong> Once you complete all matches in a round (e.g., all Quarter-Finals), the app will automatically take the winners and generate the next round's fixtures (e.g., Semi-Finals) for you. This continues until a champion is crowned.</p>
                    <RulePoint type="good"><strong>Tip:</strong> If you have an odd number of teams, one team will randomly receive a "bye" and advance to the next round automatically.</RulePoint>

                    <h5 className="font-bold text-text-primary mt-6">Round-Robin + Knockout (Hybrid Format)</h5>
                    <p>This powerful "World Cup" style format combines a group stage with a knockout phase. This option is available for tournaments with 5 or more teams.</p>
                    <Step num={1}>Select your tournament and choose the <strong>Round-Robin + Knockout</strong> format.</Step>
                    <Step num={2}>For tournaments with 6 or more teams, you'll see a checkbox: <strong>"Split teams into two groups"</strong>. This gives you full control over the group stage structure:</Step>
                    <ul className="list-disc pl-10 text-text-primary space-y-2 my-2">
                        <li>
                            <strong>Checkbox Unchecked (Default):</strong> All teams play in a single large group. After all matches, the <strong>top 4 teams</strong> advance to the semi-finals (Rank 1 vs Rank 4, Rank 2 vs Rank 3). This is ideal for 5-10 teams.
                        </li>
                        <li>
                            <strong>Checkbox Checked:</strong> The app will randomly and evenly divide teams into two groups (Group A & Group B). After all group matches, the <strong>top 2 teams from each group</strong> advance to the semi-finals (Group A Winner vs Group B Runner-up, etc.). This is recommended for larger tournaments.
                        </li>
                    </ul>
                    <Step num={3}>Set your schedule preferences (start date, etc.) and generate the group stage matches.</Step>
                    <p><strong>Automation:</strong> The app does the rest. Once you complete all the group stage matches, it will automatically calculate the final standings from the Points Table and instantly generate the Semi-Finals for you. The winners of the semis will then automatically proceed to the Final.</p>

                    <h5 className="font-bold text-text-primary mt-6">General Scheduling Tips</h5>
                    <RulePoint type="good"><strong>Tip:</strong> Ensure all teams are 'Ready' before scheduling. A ready team has the correct number of players, a captain, a vice-captain, and a wicket-keeper.</RulePoint>
                    <RulePoint type="bad"><strong>Avoid:</strong> Manually adding matches if you're using an automated format like Knockout or Round-Robin + Knockout. This can interfere with the automatic progression logic. Let the app handle it for you!</RulePoint>
                </SubSection>
            </Section>

            <Section title="Live Scoring Inputs">
                <p>The scoring screen is powerful but has a specific workflow. Always select extras (like Wide) <strong>before</strong> runs.</p>
                <SubSection title="Player Selection">
                    <p>Use the <strong>Players</strong> tab to select the initial on-strike batsman, non-striker, and the bowler. You cannot record a ball until this is done.</p>
                    <RulePoint type="good">Batsmen are locked in once selected. They can only be changed after a wicket, retirement, or by using the "Emergency Batsman Change" checkbox.</RulePoint>
                    <RulePoint type="good">The bowler is locked mid-over. They can only be changed at the end of an over, or by using the "Emergency Bowler Change" checkbox.</RulePoint>
                </SubSection>
                <SubSection title="Key Inputs & Rules">
                    <RulePoint type="good"><strong>Runs (0-6):</strong> Standard runs scored off the bat.</RulePoint>
                    <RulePoint type="good"><strong>Extras (Wide, No Ball, etc.):</strong> Select the extra type FIRST. This correctly adjusts scoring rules. For example, a "Wide" adds 1 to the total and bowler's conceded runs, plus any additional runs from overthrows.</RulePoint>
                    <RulePoint type="bad"><strong>AVOID:</strong> Selecting runs before selecting Wide/No Ball. The app will score it as runs off the bat.</RulePoint>
                    <RulePoint type="good"><strong>Wicket (W):</strong> Toggles the wicket details panel. You MUST select a dismissal type. The app filters out invalid dismissal types based on the delivery (e.g., you can't be Bowled on a Wide).</RulePoint>
                    <RulePoint type="bad"><strong>AVOID:</strong> Forgetting to select a dismissal type. The "Record" button will be disabled.</RulePoint>
                    <RulePoint type="good"><strong>Run Out:</strong> When selecting Run Out, you must also specify which batsman was out (Striker or Non-Striker) and how many runs were completed before the dismissal.</RulePoint>
                    <RulePoint type="good"><strong>Free Hit:</strong> This button activates after a No Ball. You can toggle it if needed. It's automatically consumed on the next legal delivery (not a Wide or another No Ball).</RulePoint>
                </SubSection>
                <SubSection title="Viewing Live Statistics">
                    <p>During a live match, you can switch between different views using the tabs at the top of the scoring card:</p>
                    <Step num={1}>
                        <strong>Scoreboard Tab:</strong> Get a complete, real-time overview of the match. This includes detailed batting and bowling scorecards for the current innings, a summary of the previous innings, extras, and fall of wickets.
                    </Step>
                    <Step num={2}>
                        <strong>Commentary Tab:</strong> Follow the action with a live, ball-by-ball text commentary that is automatically generated as you record each delivery. You can also view the commentary for the first innings.
                    </Step>
                </SubSection>
                <SubSection title="Other Actions">
                    <p><strong>Undo:</strong> Reverts the last ball. Can be used multiple times.</p>
                    <p><strong>Retire:</strong> Marks the striker as "Retired Hurt". A new batsman must be selected. The retired player can return later.</p>
                    <p><strong>End Innings:</strong> Manually ends the current innings (e.g., declaration).</p>
                    <p><strong>Drinks:</strong> Starts a lock-screen timer for a drinks break.</p>
                </SubSection>
            </Section>

            <Section title="Important Features">
                <p><strong>Offline First:</strong> All your data is stored locally in your browser. The app works completely offline.</p>
                <p><strong>Match Reminders:</strong> Enable notifications in Settings to get an alert 15 minutes before a scheduled tournament match begins.</p>
                <p><strong>Data Persistence:</strong> Your tournament data is saved automatically.</p>
                <p><strong>Shareable Scorecards:</strong> After a match, or for a scheduled match, use the Share icon to generate a text summary or a visual card to share with others.</p>
            </Section>
        </div>
    );
};

export default HowToUseGuide;