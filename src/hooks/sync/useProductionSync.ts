import { useEffect, useState } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
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
        const q = query(
            collections.productionTasks,
            where('outletId', '==', activeOutletId)
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
