const fs = require('fs');
const file = 'components/PlayerDetailsPage.tsx';
let src = fs.readFileSync(file, 'utf8');

const statsState = `
    const [statSection, setStatSection] = useState<'Batting' | 'Bowling' | 'Keeping' | 'Fielding'>('Batting');

    const playerStats = useMemo(() => {
        const globalId = (player as Player & { globalPlayerId?: string }).globalPlayerId || player.id;
        const linkedIds = new Set<string>();
        
        linkedIds.add(player.id);
        
        teams.forEach(t => {
            t.players.forEach(p => {
                if (((p as Player & { globalPlayerId?: string }).globalPlayerId || p.id) === globalId) {
                    linkedIds.add(p.id);
                }
            });
        });

        const batMatches = new Set<string>();
        let batInningsCount = 0;
        let runsScored = 0;
        let ballsFaced = 0;
        let fours = 0;
        let sixes = 0;
        let outs = 0;
        let highestScore = 0;
        let highestScoreNotOut = false;
        let thirties = 0;
        let fifties = 0;
        let hundreds = 0;

        const bowlMatches = new Set<string>();
        let bowlInningsCount = 0;
        let ballsBowled = 0;
        let runsConceded = 0;
        let wickets = 0;
        let threeWickets = 0;
        let fourWickets = 0;

        const fieldMatches = new Set<string>();
        let catches = 0;
        let runOuts = 0;
        
        const keepMatches = new Set<string>();
        let stumpings = 0;
        let keepingCatches = 0;
        let keepingRunOuts = 0;

        let momCountInner = 0;
        
        const isWicketKeeper = player.role === 'Wicket Keeper';

        matches.filter(m => m.status === 'completed').forEach(m => {
            let playedBatting = false;
            let playedBowling = false;
            let playedFielding = false;
            let playedKeeping = false;
            
            let matchMom = false;
            if (m.manOfTheMatchId && linkedIds.has(m.manOfTheMatchId)) {
                momCountInner++;
                matchMom = true;
            }

            const processInnings = (innings: Innings | undefined) => {
                if (!innings) return;
                
                let innPlayedBat = false;
                let innPlayedBowl = false;
                
                linkedIds.forEach(id => {
                    const batScore = innings.batsmanScores[id];
                    if (batScore && (batScore.balls > 0 || batScore.runs > 0 || batScore.status !== 'Did Not Bat')) {
                        innPlayedBat = true;
                        batInningsCount++;
                        runsScored += batScore.runs;
                        ballsFaced += batScore.balls;
                        fours += batScore.fours;
                        sixes += batScore.sixes;
                        if (batScore.status !== 'Not Out' && batScore.status !== 'Retired Hurt') {
                            outs++;
                        }
                        if (batScore.runs > highestScore) {
                            highestScore = batScore.runs;
                            highestScoreNotOut = batScore.status === 'Not Out';
                        } else if (batScore.runs === highestScore && batScore.status === 'Not Out') {
                            highestScoreNotOut = true;
                        }
                        
                        if (batScore.runs >= 100) hundreds++;
                        else if (batScore.runs >= 50) fifties++;
                        else if (batScore.runs >= 30) thirties++;
                    }

                    const bowlScore = innings.bowlerScores[id];
                    if (bowlScore && (bowlScore.overs > 0 || bowlScore.runsConceded > 0 || bowlScore.wickets > 0)) {
                        innPlayedBowl = true;
                        bowlInningsCount++;
                        const completedOvers = Math.floor(bowlScore.overs);
                        const partialBalls = Math.round((bowlScore.overs - completedOvers) * 10);
                        const innBallsBowled = completedOvers * 6 + partialBalls;
                        ballsBowled += innBallsBowled; 
                        runsConceded += bowlScore.runsConceded;
                        wickets += bowlScore.wickets;
                        
                        if (bowlScore.wickets >= 4) fourWickets++;
                        else if (bowlScore.wickets === 3) threeWickets++;
                    }
                });

                innings.balls.forEach(ball => {
                    if (ball.wicket && ball.wicket.fielderIds) {
                        const isLinkedFielder = ball.wicket.fielderIds.some(fielderId => linkedIds.has(fielderId));
                        if (isLinkedFielder) {
                            if (ball.wicket.type === 'Caught') {
                                if (isWicketKeeper) keepingCatches++;
                                else catches++;
                            } else if (ball.wicket.type === 'Stumped') {
                                stumpings++;
                            } else if (ball.wicket.type === 'Run Out') {
                                if (isWicketKeeper) keepingRunOuts++;
                                else runOuts++;
                            }
                            
                            if (isWicketKeeper && (ball.wicket.type === 'Caught' || ball.wicket.type === 'Run Out' || ball.wicket.type === 'Stumped')) {
                                playedKeeping = true;
                            } else {
                                playedFielding = true;
                            }
                        }
                    }
                });

                if (innPlayedBat) playedBatting = true;
                if (innPlayedBowl) playedBowling = true;
            };

            processInnings(m.innings1);
            processInnings(m.innings2);
            
            let involved = false;
            if (playedBatting) { batMatches.add(m.id); involved = true; }
            if (playedBowling) { bowlMatches.add(m.id); involved = true; }
            if (playedFielding) { fieldMatches.add(m.id); involved = true; }
            if (playedKeeping) { keepMatches.add(m.id); involved = true; }
            
            if (!involved && matchMom) {
                 batMatches.add(m.id);
            }
            
        });

        let overallMatchesCount = new Set([...batMatches, ...bowlMatches, ...fieldMatches, ...keepMatches]).size;

        return {
            overallMatches: overallMatchesCount,
            batting: {
                matches: batMatches.size,
                innings: batInningsCount,
                runs: runsScored,
                balls: ballsFaced,
                highest: highestScore,
                highestNotOut: highestScoreNotOut,
                average: outs > 0 ? (runsScored / outs).toFixed(1) : (runsScored > 0 ? '-' : '-'),
                strikeRate: ballsFaced > 0 ? ((runsScored / ballsFaced) * 100).toFixed(1) : '-',
                fours,
                sixes,
                thirties,
                fifties,
                hundreds,
                outs
            },
            bowling: {
                matches: bowlMatches.size,
                innings: bowlInningsCount,
                overs: (Math.floor(ballsBowled / 6) + (ballsBowled % 6) / 10).toFixed(1),
                balls: ballsBowled,
                runs: runsConceded,
                wickets,
                average: wickets > 0 ? (runsConceded / wickets).toFixed(1) : '-',
                economy: ballsBowled > 0 ? (runsConceded / (ballsBowled / 6)).toFixed(1) : '-',
                strikeRate: wickets > 0 ? (ballsBowled / wickets).toFixed(1) : '-',
                threeW: threeWickets,
                fourW: fourWickets
            },
            fielding: {
                catches,
                runOuts
            },
            keeping: {
                matches: keepMatches.size,
                catches: keepingCatches,
                stumpings,
                runOuts: keepingRunOuts,
                isRelevant: isWicketKeeper || stumpings > 0 || keepingCatches > 0 || keepingRunOuts > 0
            },
            mom: momCountInner
        };
    }, [matches, teams, player]);
`;

let targetLine = "    // Linked Teams logic";
src = src.replace(targetLine, statsState + '\n    ' + targetLine);

fs.writeFileSync(file, src);
