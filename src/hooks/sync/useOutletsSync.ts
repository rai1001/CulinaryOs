import { useEffect, useState } from 'react';
import { onSnapshot, query } from 'firebase/firestore';
import { collections } from '../../firebase/collections';
import { useStore } from '../../store/useStore';
import type { Outlet } from '../../types';

export const useOutletsSync = () => {
    const { setOutlets, activeOutletId, setActiveOutletId } = useStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to all outlets (or filter by user permission in a real app)
        // For now, we fetch all to show the selector list
        const q = query(collections.outlets);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const outletsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Outlet[];

            console.log("Synced Outlets:", outletsData.length);
            setOutlets(outletsData);

            // Auto-select logic if none selected or selection invalid
            if (outletsData.length > 0) {
                const isValid = outletsData.find(o => o.id === activeOutletId);
                if (!activeOutletId || !isValid) {
                    // Prefer 'main_kitchen' or just the first one
                    const defaultOutlet = outletsData.find(o => o.type === 'main_kitchen') || outletsData[0];
                    console.log("Auto-selecting outlet:", defaultOutlet.name);
                    setActiveOutletId(defaultOutlet.id);
                }
            }

            setLoading(false);
        }, (error) => {
            console.error("Error syncing outlets:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setOutlets, activeOutletId, setActiveOutletId]);

    return { loading };
};
