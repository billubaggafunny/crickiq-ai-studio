import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PlayerNavigationPayload } from '../types/playerNavigation';

interface PlayerNavigationContextProps {
    navigationContext: PlayerNavigationPayload | null;
    openPlayerDetails: (context: PlayerNavigationPayload) => void;
    returnFromPlayerDetails: () => void;
}

const PlayerNavigationContext = createContext<PlayerNavigationContextProps | undefined>(undefined);

export const PlayerNavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [navigationContext, setNavigationContext] = useState<PlayerNavigationPayload | null>(null);

    const openPlayerDetails = (context: PlayerNavigationPayload) => {
        setNavigationContext(context);
    };

    const returnFromPlayerDetails = () => {
        setNavigationContext(null);
    };

    return (
        <PlayerNavigationContext.Provider value={{ navigationContext, openPlayerDetails, returnFromPlayerDetails }}>
            {children}
        </PlayerNavigationContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePlayerNavigation = () => {
    const context = useContext(PlayerNavigationContext);
    if (!context) {
        throw new Error('usePlayerNavigation must be used within a PlayerNavigationProvider');
    }
    return context;
};
