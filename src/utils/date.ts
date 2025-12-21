export const normalizeDate = (date: any): string => {
    if (!date) return '';
    try {
        // If it's a string, attempt to extract the YYYY-MM-DD part directly
        if (typeof date === 'string') {
            const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (match) {
                return match[0];
            }
            // Fallback for other string formats
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // Handle Firestore Timestamp
        if (date && typeof date === 'object' && 'seconds' in date) {
            const d = new Date(date.seconds * 1000);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        // Handle Date object
        if (date instanceof Date) {
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        return '';
    } catch (e) {
        console.warn('Error normalizing date:', date);
        return '';
    }
};
