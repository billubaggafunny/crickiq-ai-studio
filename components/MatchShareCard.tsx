
import React from 'react';
import type { Match, Team, Tournament } from '../types';

interface MatchShareCardProps {
    match: Match;
    team1: Team;
    team2: Team;
    tournament: Tournament;
}

const MatchShareCard: React.FC<MatchShareCardProps> = ({ match, team1, team2, tournament }) => {
    
    // All styles must be self-contained here to be rendered into the SVG.
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=Oxanium:wght@800&display=swap');
        
        .share-card-container {
            width: 400px;
            height: 500px;
            font-family: 'Inter', sans-serif;
            background-image: linear-gradient(160deg, #c59cff, #f5f3ff);
            color: #111827;
            display: flex;
            flex-direction: column;
            padding: 24px;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
        }
        .share-card-container h1, .share-card-container h2, .share-card-container h3, .share-card-container p {
            margin: 0;
            padding: 0;
        }
        .tournament-name {
            font-size: 16px;
            font-weight: 700;
            text-align: center;
            opacity: 0.8;
            margin-bottom: 24px;
        }
        .teams-section {
            display: flex;
            justify-content: space-around;
            align-items: center;
            text-align: center;
            margin-bottom: 24px;
        }
        .team-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 120px;
        }
        .team-logo {
            width: 80px;
            height: 80px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 900;
            color: white;
            text-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .team-name {
            font-size: 18px;
            font-weight: 800;
            line-height: 1.2;
        }
        .vs-text {
            font-family: 'Oxanium', sans-serif;
            font-size: 36px;
            font-weight: 400;
            opacity: 0.7;
        }
        .details-section {
            border-top: 1px solid rgba(0,0,0,0.1);
            border-bottom: 1px solid rgba(0,0,0,0.1);
            padding: 16px 0;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-around;
            text-align: center;
            font-size: 14px;
        }
        .detail-item {
            font-weight: 700;
        }
        .detail-item span {
            display: block;
            font-size: 12px;
            font-weight: 400;
            opacity: 0.7;
            margin-top: 4px;
        }
        .footer {
            margin-top: auto;
            font-family: 'Oxanium', sans-serif;
            font-size: 24px;
            opacity: 0.9;
            text-align: center;
        }
    `;

    const formatTime = (timeString: string | undefined) => {
        if (!timeString) return '';
        const [hourString, minute] = timeString.split(':');
        const hour = +hourString % 24;
        return new Date(1970, 0, 1, hour, +minute).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true});
    };

    return (
        <div className="share-card-container">
            <style>{styles}</style>
            
            <h3 className="tournament-name">{tournament.name}</h3>

            <div className="teams-section">
                <div className="team-info">
                    <div className="team-logo" style={{ backgroundColor: team1.logo }}>
                        {team1.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h2 className="team-name">{team1.name}</h2>
                </div>
                <h1 className="vs-text">VS</h1>
                <div className="team-info">
                     <div className="team-logo" style={{ backgroundColor: team2.logo }}>
                        {team2.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h2 className="team-name">{team2.name}</h2>
                </div>
            </div>

            <div className="details-section">
                <div className="detail-item">
                    {new Date(match.date.replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span>Date</span>
                </div>
                <div className="detail-item">
                    {formatTime(match.time)}
                    <span>Time</span>
                </div>
                <div className="detail-item">
                    {match.oversPerInnings}
                    <span>Overs</span>
                </div>
            </div>

            <div className="footer">
                Crick<span style={{ color: 'var(--color-danger)' }}>IQ</span>
            </div>
        </div>
    );
};

export default MatchShareCard;
