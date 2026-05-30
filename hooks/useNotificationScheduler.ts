import { useEffect, useRef } from 'react';
import type { Match, Team } from '../types';

export const useNotificationScheduler = (
    matches: Match[],
    getTeamById: (id: string) => Team | undefined,
    notificationsEnabled: boolean
) => {
    // FIX: Use `number` for timeout IDs as this is a browser environment and `setTimeout` returns a number.
    // This resolves ambiguity with `ReturnType<typeof setTimeout>` which can be problematic in some TypeScript configurations.
    const scheduledNotifications = useRef<Record<string, number>>({});

    useEffect(() => {
        // Clear all previous timeouts
        // FIX: Cast timeoutId to number to resolve type error from Object.values returning unknown[].
        Object.values(scheduledNotifications.current).forEach(timeoutId => clearTimeout(timeoutId as number));
        scheduledNotifications.current = {};

        if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }
        
        const now = Date.now();
        // Notification 15 minutes before the match
        const NOTIFICATION_LEAD_TIME = 15 * 60 * 1000;

        matches.forEach(match => {
            if (match.status === 'scheduled' && match.time && match.date) {
                try {
                    // Use replace to avoid timezone issues with 'YYYY-MM-DD' format
                    const matchDateTime = new Date(`${match.date.replace(/-/g, '/')}T${match.time}`).getTime();
                    const notificationTime = matchDateTime - NOTIFICATION_LEAD_TIME;
                    const delay = notificationTime - now;

                    if (delay > 0) {
                        const timeoutId = setTimeout(() => {
                            const team1 = getTeamById(match.team1Id);
                            const team2 = getTeamById(match.team2Id);
                            if (!team1 || !team2) return;

                            const formattedTime = new Date(matchDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const title = `Match Reminder: ${team1.name} vs ${team2.name}`;
                            const options = {
                                body: `The match starts at ${formattedTime}.`,
                                icon: '/vite.svg', // A default icon
                            };
                            
                            // Use service worker to show notification for better reliability
                            navigator.serviceWorker.getRegistration().then(registration => {
                                if (registration) {
                                    registration.showNotification(title, options);
                                } else {
                                    // Fallback to basic notification if service worker isn't ready
                                    new Notification(title, options);
                                }
                            });

                            delete scheduledNotifications.current[match.id];
                        }, delay);

                        scheduledNotifications.current[match.id] = timeoutId as unknown as number;
                    }
                } catch (e) {
                    console.error("Error scheduling notification for match:", match.id, e);
                }
            }
        });

        return () => {
            // FIX: Cast timeoutId to number to resolve type error from Object.values returning unknown[].
            Object.values(scheduledNotifications.current).forEach(timeoutId => clearTimeout(timeoutId as number));
        };
    }, [matches, notificationsEnabled, getTeamById]);
};