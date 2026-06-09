import React, { useState, useEffect, useRef } from 'react';

interface SafeChartWrapperProps {
    children: React.ReactNode;
}

export const SafeChartWrapper: React.FC<SafeChartWrapperProps> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasDimensions, setHasDimensions] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    setHasDimensions(true);
                } else {
                    setHasDimensions(false);
                }
            }
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}>
            {hasDimensions && children}
        </div>
    );
};
