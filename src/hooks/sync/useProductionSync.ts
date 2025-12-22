import { useEffect, useState } from 'react';
import { onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { collections } from '../../firebase/collections';
import { useStore } from '../../store/useStore';
import type { KanbanTask } from '../../types';

export const useProductionSync = () => {
    const { activeOutletId, replaceAllProductionTasks } = useStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!activeOutletId) {
            replaceAllProductionTasks({});
            setLoading(false);
            return;
        }

        setLoading(true);

        // Optimization: Only fetch tasks updated in the last 7 days or incomplete
        // Strategy: Query items for this outlet where 'date' >= 7 days ago.

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - 7);
        const dateStr = daysAgo.toISOString(); // Assuming 'date' stored as ISO string in tasks

        const q = query(
            collections.productionTasks,
            where('outletId', '==', activeOutletId),
            where('date', '>=', dateStr),
            orderBy('date', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as KanbanTask[];

            // Group by eventId
            const grouped: Record<string, KanbanTask[]> = {};
            allTasks.forEach(task => {
                const eId = task.eventId || 'orphan';
                if (!grouped[eId]) grouped[eId] = [];
                grouped[eId].push(task);
            });

            replaceAllProductionTasks(grouped);
            setLoading(false);
        }, (err) => {
            console.error("Error syncing production tasks:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeOutletId, replaceAllProductionTasks]);

    return { loading, error };
};
