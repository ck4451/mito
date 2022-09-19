// Utilities for working with time

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 4 * WEEK; // THIS IS OFF, but it's ok...
const YEAR = 365 * DAY;

/**
 * Given a timestamp, returns a string that represents how long ago 
 * this was - for displaying to the user.
 * 
 * If the timestamp doesn't exist, it just returns '--', like Finder.
 */
export const getLastModifiedString = (timestamp: number | null | undefined): string => {
    if (timestamp === null || timestamp === undefined) {
        return '--';
    }
    
    const delta = Math.floor(Date.now() / 1000) - timestamp;

    if (delta < HOUR) {
        const numMinutes = Math.round(delta / MINUTE);
        return `${numMinutes} minutes ago`
    } else if (delta < DAY) {
        const numHours = Math.round(delta / HOUR);
        return `${numHours} hours ago`
    } else if (delta < WEEK) {
        const numDays = Math.round(delta / DAY);
        return `${numDays} days ago`
    } else if (delta < MONTH) {
        const numWeeks = Math.round(delta / WEEK);
        return `${numWeeks} weeks ago`
    } else if (delta < YEAR) {
        const numMonths = Math.round(delta / MONTH);
        return `${numMonths} months ago`
    } else {
        const numYears = Math.round(delta / YEAR);
        return `${numYears} years ago`
    }
}