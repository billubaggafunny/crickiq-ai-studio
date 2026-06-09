import React from 'react';

export interface CrickIQCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
    accentColor?: string;
}

const CrickIQCard: React.FC<CrickIQCardProps> = ({ children, className = '', noPadding = false, accentColor, ...rest }) => {
    // Official Card Specifications:
    // - Radius: 20px (rounded-3xl)
    // - Padding: 24px (p-6)
    // - Border: Standardized subtle (border border-brand-blue/15)
    // - Shadow: Standardized soft elevation (shadow-sm)
    
    const paddingClass = noPadding ? '' : 'p-6';
    
    return (
        <div 
            {...rest} 
            className={`bg-secondary rounded-3xl shadow-[0_4px_14px_rgba(0,0,0,0.28)] dark:shadow-md dark:shadow-black/20 ${paddingClass} ${className} ${accentColor ? 'border-l-[6px] border-solid' : ''}`}
            style={accentColor ? { ...rest.style, borderLeftColor: accentColor } : rest.style}
        >
            {children}
        </div>
    );
};

export default CrickIQCard;
