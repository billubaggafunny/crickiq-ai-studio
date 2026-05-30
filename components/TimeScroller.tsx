import React, { useState, useEffect } from 'react';

interface TimeScrollerProps {
    value: string; // "HH:mm" format
    onChange: (newValue: string) => void;
}

const formatTimePart = (part: number) => part.toString().padStart(2, '0');

const parseValue = (val: string) => {
    // Add a fallback for incorrect format to prevent crashes
    if (!val || !val.includes(':')) {
        val = '10:00';
    }
    const [h, m] = val.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    let hour = h % 12;
    if (hour === 0) hour = 12; // 00 hours is 12 AM, 12 is 12 PM
    return { hour, minute: m, period };
};

const TimeScroller: React.FC<TimeScrollerProps> = ({ value, onChange }) => {
    const [hour, setHour] = useState<string>('');
    const [minute, setMinute] = useState<string>('');
    const [period, setPeriod] = useState<string>('');

    // Sync internal state ONLY when the `value` prop changes from the parent.
    // This is the single source of truth from outside and prevents update loops.
    useEffect(() => {
        const { hour: newHour, minute: newMinute, period: newPeriod } = parseValue(value);
        const timeoutId = setTimeout(() => {
            setHour(formatTimePart(newHour));
            setMinute(formatTimePart(newMinute));
            setPeriod(newPeriod);
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [value]);

    const propagateChange = (currentHour: string, currentMinute: string, currentPeriod: string) => {
        const numHour = parseInt(currentHour, 10);
        const numMinute = parseInt(currentMinute, 10);

        if (isNaN(numHour) || isNaN(numMinute) || numHour < 1 || numHour > 12 || numMinute < 0 || numMinute > 59) {
            return; // Don't propagate invalid values
        }

        let h24 = numHour;
        if (currentPeriod === 'PM' && numHour !== 12) {
            h24 += 12;
        }
        if (currentPeriod === 'AM' && numHour === 12) { // Midnight case
            h24 = 0;
        }
        
        const newValue = `${formatTimePart(h24)}:${formatTimePart(numMinute)}`;
        onChange(newValue);
    };

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length > 2) val = val.slice(0, 2);
        setHour(val);
    };

    const handleHourBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1 || val > 12) {
            val = 12; // Default to 12 if invalid
        }
        const formattedHour = formatTimePart(val);
        setHour(formattedHour);
        propagateChange(formattedHour, minute, period);
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length > 2) val = val.slice(0, 2);
        setMinute(val);
    };
    
    const handleMinuteBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 0 || val > 59) {
            val = 0; // Default to 00 if invalid
        }
        const formattedMinute = formatTimePart(val);
        setMinute(formattedMinute);
        propagateChange(hour, formattedMinute, period);
    };

    const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
        setPeriod(newPeriod);
        propagateChange(hour, minute, newPeriod);
    };

    return (
        <div className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 border border-brand-blue/15 rounded-lg p-2 h-14">
            <input
                type="text"
                inputMode="numeric"
                value={hour}
                onChange={handleHourChange}
                onBlur={handleHourBlur}
                className="w-16 text-center text-h3 font-semibold bg-gray-100 dark:bg-black/20 rounded-md py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                aria-label="Hour"
                maxLength={2}
            />
            <span className="text-h3 text-text-secondary -mt-1">:</span>
            <input
                type="text"
                inputMode="numeric"
                value={minute}
                onChange={handleMinuteChange}
                onBlur={handleMinuteBlur}
                className="w-16 text-center text-h3 font-semibold bg-gray-100 dark:bg-black/20 rounded-md py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
                aria-label="Minute"
                maxLength={2}
            />
            <div className="flex-grow"></div>
            <div className="flex bg-gray-100 dark:bg-black/20 rounded-md p-0.5">
                <button
                    onClick={() => handlePeriodChange('AM')}
                    className={`w-12 h-8 rounded text-button transition-colors duration-200 ${
                        period === 'AM' ? 'bg-brand-blue text-white shadow' : 'text-text-secondary hover:bg-white dark:hover:bg-black/50'
                    }`}
                    aria-pressed={period === 'AM'}
                >
                    AM
                </button>
                <button
                    onClick={() => handlePeriodChange('PM')}
                    className={`w-12 h-8 rounded text-button transition-colors duration-200 ${
                        period === 'PM' ? 'bg-brand-blue text-white shadow' : 'text-text-secondary hover:bg-white dark:hover:bg-black/50'
                    }`}
                    aria-pressed={period === 'PM'}
                >
                    PM
                </button>
            </div>
        </div>
    );
};

export default TimeScroller;
