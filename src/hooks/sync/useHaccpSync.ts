import { useEffect, useState } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import { collections } from '../../firebase/collections';
import { useStore } from '../../store/useStore';

export const useHaccpSync = () => {
    const {
        setHACCPLogs,
        setHACCPTasks,
        setHACCPTaskCompletions,
        setPCCs,
        activeOutletId
    } = useStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeOutletId) {
            setHACCPLogs([]);
            setHACCPTasks([]);
            setHACCPTaskCompletions([]);
            setPCCs([]);
            setLoading(false);
            return;
        }

        const qLogs = query(collections.haccpLogs, where('outletId', '==', activeOutletId));
        const qTasks = query(collections.haccpTasks, where('outletId', '==', activeOutletId));
        const qCompletions = query(collections.haccpTaskCompletions, where('outletId', '==', activeOutletId));
        const qPCCs = query(collections.pccs, where('outletId', '==', activeOutletId));

        const unsubLogs = onSnapshot(qLogs, (snap) => {
            setHACCPLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        });

        const unsubTasks = onSnapshot(qTasks, (snap) => {
            setHACCPTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        });

        const unsubCompletions = onSnapshot(qCompletions, (snap) => {
            setHACCPTaskCompletions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
        });

        const unsubPCCs = onSnapshot(qPCCs, (snap) => {
            setPCCs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
            setLoading(false); // Assume loaded when PCCs load (approx)
        });

        return () => {
            unsubLogs();
            unsubTasks();
            unsubCompletions();
            unsubPCCs();
        };
    }, [activeOutletId, setHACCPLogs, setHACCPTasks, setHACCPTaskCompletions, setPCCs]);

    return { loading };
};
