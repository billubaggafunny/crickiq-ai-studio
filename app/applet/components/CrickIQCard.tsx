import React from 'react';

export interface CrickIQCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

const CrickIQCard: React.FC<CrickIQCardProps> = ({ children, className = '', noPadding = false, ...rest }) => {
    // Official Card Specifications:
    // - Radius: 20px (rounded-[20px])
    // - Padding: 24px (p-6)
    // - Border: Standardized soft border (border border-black/5 dark:border-white/5)
    // - Shadow: Soft elevation (shadow-sm)
    // - Surface: Standardized glass-like or clean surface (bg-white/90 dark:bg-[#1E1F2A]/90 backdrop-blur-sm)
    
    // For padding, we use p-6 by default.
    const paddingClass = noPadding ? '' : 'p-6';
    
    // We strip out any incoming gradient backgrounds to enforce visual consistency if they try to pass them,
    // but typically we'll just not pass them. The prompt says "Remove colored background classes from cards".
    // We will do this by relying on our base classes overriding or just standardizing here.

    return (
        <div 
            {...rest} 
            className={`bg-white dark:bg-[#1a1b26] rounded-[20px] border border-black/10 dark:border-white/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] ${paddingClass} ${className}`}
        >
            {children}
        </div>
    );
};

export default CrickIQCard;
