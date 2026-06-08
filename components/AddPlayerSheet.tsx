import React, { useEffect } from 'react';
import type { PlayerRole, Player } from '../types';
import { usePlayerNavigation } from '../contexts/PlayerNavigationContext';

interface AddPlayerSheetProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    existingPlayers?: Player[];
    teams?: import('../types').Team[];
    onAddPlayer?: (teamId: string, input: {
        name: string;
        role: PlayerRole;
        jerseyNumber?: number;
        battingStyle?: string;
        bowlingStyle?: string;
        isCaptain?: boolean;
        isViceCaptain?: boolean;
        isWicketKeeper?: boolean;
        globalPlayerId?: string;
    }) => void;
}

export const AddPlayerSheet: React.FC<AddPlayerSheetProps> = ({
    isOpen,
    onClose,
    teamId
}) => {
    const { openPlayerDetails } = usePlayerNavigation();

    useEffect(() => {
        if (isOpen) {
            // Immediately close this sheet
            onClose();
            // Launch the unified PlayerDetailsPage in add mode
            openPlayerDetails({
                sourceScreen: 'TeamDetailsPage',
                teamId: teamId,
                returnTo: 'team_details',
                mode: 'add'
            });
        }
    }, [isOpen, onClose, openPlayerDetails, teamId]);

    return null;
};
