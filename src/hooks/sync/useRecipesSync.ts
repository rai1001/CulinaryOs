import { useEffect, useState } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import { collections } from '../../firebase/collections';
import { useStore } from '../../store/useStore';
import type { Recipe } from '../../types';

export const useRecipesSync = () => {
    const { activeOutletId, setRecipes } = useStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!activeOutletId) {
            setRecipes([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collections.recipes,
            where('outletId', '==', activeOutletId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Recipe[];

            setRecipes(data);
            setLoading(false);
        }, (err) => {
            console.error("Error syncing recipes:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeOutletId, setRecipes]);

    return { loading, error };
};
