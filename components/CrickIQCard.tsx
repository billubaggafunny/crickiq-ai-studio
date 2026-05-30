import React from 'react';

export interface CrickIQCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

const CrickIQCard: React.FC<CrickIQCardProps> = ({ children, className = '', noPadding = false, ...rest }) => {
    // Official Card Specifications:
    // - Radius: 20px (rounded-3xl)
    // - Padding: 24px (p-6)
    // - Border: Standardized subtle (border border-brand-blue/15)
    // - Shadow: Standardized soft elevation (shadow-sm)
    
    const paddingClass = noPadding ? '' : 'p-6';
    
    return (
        <div 
            {...rest} 
            className={`bg-primary border border-light-border dark:border-brand-blue/15 rounded-3xl shadow-md ${paddingClass} ${className}`}
        >
            {children}
        </div>
    );
};

export default CrickIQCard;
