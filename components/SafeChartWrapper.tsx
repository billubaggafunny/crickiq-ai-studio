import React, { useState, useEffect, useRef } from 'react';

interface SafeChartWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export const SafeChartWrapper: React.FC<SafeChartWrapperProps> = ({ children, className = "" }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        
        const updateSize = () => {
             if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setSize({ width, height });
             }
        };
        
        updateSize();

        const observer = new ResizeObserver(() => {
            updateSize();
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    const isValidSize =
        size.width > 0 &&
        size.height > 0 &&
        Number.isFinite(size.width) &&
        Number.isFinite(size.height);

    return (
        <div ref={containerRef} className={`relative w-full h-full min-w-0 min-h-0 overflow-hidden ${className}`}>
            {isValidSize ? (
                children
            ) : (
                <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                   Chart loading...
                </div>
            )}
        </div>
    );
};
