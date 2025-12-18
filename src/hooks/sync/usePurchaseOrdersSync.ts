import { useEffect, useState } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import { collections } from '../../firebase/collections';
import { useStore } from '../../store/useStore';
import type { PurchaseOrder } from '../../types';

export const usePurchaseOrdersSync = () => {
    const { setPurchaseOrders, activeOutletId } = useStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeOutletId) {
            setPurchaseOrders([]);
            setLoading(false);
            return;
        }

        const q = query(
            collections.purchaseOrders,
            where('outletId', '==', activeOutletId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PurchaseOrder[];

            setPurchaseOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error("Error syncing purchase orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeOutletId, setPurchaseOrders]);

    return { loading };
};
