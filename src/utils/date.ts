export const normalizeDate = (date: any): string => {
    if (!date) return '';
    try {
        // Handle Firestore Timestamp
        if (date && typeof date === 'object' && 'seconds' in date) {
            return new Date(date.seconds * 1000).toISOString().split('T')[0];
        }

        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    } catch (e) {
        console.warn('Error normalizing date:', date);
        return '';
    }
};
