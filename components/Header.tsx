import React from 'react';
import { SettingsIcon, LogoutIcon } from '../constants';

export interface HeaderProps {
    title: string;
    showMenu?: boolean;
    onMenuClick?: () => void;
    showSettings?: boolean;
    onSettingsClick?: () => void;
    showLogout?: boolean;
    onLogoutClick?: () => void;
    showClose?: boolean;
    onCloseClick?: () => void;
    showBack?: boolean;
    onBackClick?: () => void;
    actionButton?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ 
    title, 
    showMenu = false, 
    onMenuClick, 
    showSettings = false, 
    onSettingsClick, 
    showLogout = false, 
    onLogoutClick,
    showClose = false,
    onCloseClick,
    showBack = false,
    onBackClick,
    actionButton
}) => {
    return (
        <header className="h-[56px] px-2 md:px-4 bg-brand-gradient text-white shadow-sm flex items-center justify-between sticky top-0 z-20 backdrop-blur-md safe-pad-t shrink-0">
            {/* Left: Brand Logo, Back, Menu, or Close */}
            <div className="flex items-center gap-2 min-w-[100px]">
                {showMenu && onMenuClick && (
                    <button 
                        onClick={onMenuClick} 
                        className="w-11 h-11 flex items-center justify-center rounded-2xl text-white hover:bg-white/20 transition-colors md:hidden" 
                        title="Menu" 
                        aria-label="Open menu"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                )}
                {showBack && onBackClick && (
                    <button 
                        onClick={onBackClick}
                        className="w-11 h-11 flex items-center justify-center rounded-2xl text-white hover:bg-white/20 transition-colors"
                        title="Back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                )}
                {showClose && onCloseClick && (
                    <button 
                        onClick={onCloseClick}
                        className="w-11 h-11 flex items-center justify-center rounded-2xl text-white hover:bg-white/20 transition-colors"
                        title="Close"
                    >
                        <span className="text-2xl leading-none">&times;</span>
                    </button>
                )}
                <div className={`font-display text-[20px] md:text-[24px] ${(showMenu || showClose || showBack) ? 'hidden xl:block' : ''}`}>
                    <span className="text-white">Crick<span className="text-white font-sharp-cardinal">IQ</span></span>
                </div>
            </div>

            {/* Middle: Screen Title */}
            <div className="flex-1 flex justify-center px-2 truncate min-w-0">
                <h1 className="text-h1 text-white truncate text-center leading-none">
                    {title}
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-end min-w-[100px] gap-1 shrink-0">
                {actionButton}
                {showSettings && onSettingsClick && (
                    <button 
                        onClick={onSettingsClick} 
                        className="w-11 h-11 flex items-center justify-center rounded-2xl text-white hover:bg-white/20 transition-colors" 
                        title="Settings"
                    >
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                )}
                {showLogout && onLogoutClick && (
                    <button 
                        onClick={onLogoutClick} 
                        className="w-11 h-11 flex items-center justify-center rounded-2xl text-white hover:bg-white/20 transition-colors" 
                        title="Logout"
                    >
                        <LogoutIcon className="w-6 h-6" />
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
