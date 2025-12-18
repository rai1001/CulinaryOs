import { useEffect, useState } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import { collections } from '../../firebase/collections';
import { useStore } from '../../store/useStore';
import type { Ingredient } from '../../types';

export const useIngredientsSync = () => {
    const { activeOutletId, setIngredients } = useStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!activeOutletId) {
            setIngredients([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collections.ingredients,
            where('outletId', '==', activeOutletId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Ingredient[];

            setIngredients(data);
            setLoading(false);
        }, (err) => {
            console.error("Error syncing ingredients:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeOutletId, setIngredients]);

    return { loading, error };
};
