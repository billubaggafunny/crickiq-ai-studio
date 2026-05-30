import React, { useState } from 'react';
import CrickIQCard from './CrickIQCard';

interface CalendarProps {
    selectedDate: string; // YYYY-MM-DD
    onSelectDate: (date: string) => void;
    position?: 'down' | 'up';
}

const parseDateString = (dateString?: string): Date => {
    // Handles 'YYYY-MM-DD' string by splitting to avoid timezone issues with `new Date(string)`.
    // It creates a date object in the user's local timezone.
    if (dateString) {
        const parts = dateString.split('-').map(Number);
        // new Date(year, monthIndex, day)
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};


const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate, position = 'down' }) => {
    const [currentDate, setCurrentDate] = useState(parseDateString(selectedDate || undefined));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday

    const calendarDays = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        calendarDays.push(<div key={`empty-start-${i}`} className="p-1"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const isSelected = selectedDate === dateString;
        const isToday = date.getTime() === today.getTime();
        const isPast = date < today;

        let dayClass = 'w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200';
        if (isPast) {
            dayClass += ' text-text-secondary cursor-not-allowed';
        } else if (isSelected) {
            dayClass += ' bg-brand-blue text-white font-bold shadow-lg';
        } else if (isToday) {
            dayClass += ' bg-brand-blue/20 text-brand-blue font-bold ring-2 ring-brand-blue/50';
        } else {
            dayClass += ' text-text-primary hover:bg-primary cursor-pointer';
        }

        calendarDays.push(
            <div key={day} className="p-1 flex justify-center items-center">
                <button
                    onClick={() => !isPast && onSelectDate(dateString)}
                    className={dayClass}
                    disabled={isPast}
                    aria-label={`Select date ${date.toDateString()}`}
                    aria-pressed={isSelected}
                    aria-disabled={isPast}
                >
                    {day}
                </button>
            </div>
        );
    }
    
    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const positionClasses = position === 'up'
        ? 'bottom-full mb-2'
        : 'top-full mt-2';

    return (
        <CrickIQCard className={`absolute ${positionClasses} left-0 z-40 w-full max-w-sm shadow-xl`} role="dialog" aria-modal="true">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-2xl hover:bg-primary/80 transition-colors" aria-label="Previous month">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
                <div className="font-bold text-h3 text-text-primary" aria-live="polite">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={handleNextMonth} className="p-2 rounded-2xl hover:bg-primary/80 transition-colors" aria-label="Next month">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                    let dayClass = 'p-2 text-caption font-bold ';
                    if (index === 0 || index === 6) { // Sunday or Saturday
                        dayClass += 'text-danger';
                    } else { // Weekdays
                        dayClass += 'text-text-secondary';
                    }
                    // Using index in the key to differentiate the two 'S' days
                    return <div key={`${day}-${index}`} className={dayClass}>{day}</div>;
                })}
                {calendarDays}
            </div>
        </CrickIQCard>
    );
};

export default Calendar;
