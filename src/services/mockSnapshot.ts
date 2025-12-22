import { onSnapshot as firebaseOnSnapshot, Query } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

export const onSnapshotMockable = <T = DocumentData>(
    query: Query<T>,
    collectionName: string,
    onNext: (snapshot: { docs: any[] }) => void,
    onError?: (error: Error) => void,
    filterOutletId?: string | null
) => {
    const mockDBStr = typeof localStorage !== 'undefined' ? localStorage.getItem('E2E_MOCK_DB') : null;

    if (mockDBStr) {
        try {
            const db = JSON.parse(mockDBStr);
            let items = db[collectionName] || [];

            // Apply outlet filtering if requested
            if (filterOutletId) {
                items = items.filter((item: any) => item.outletId === filterOutletId);
            }

            setTimeout(() => {
                onNext({
                    docs: items.map((item: any) => ({
                        id: item.id || 'mock-id',
                        data: () => item
                    }))
                });
            }, 0);

            // Return a dummy unsubscribe
            return () => { };
        } catch (e) {
            console.error('[MockSnapshot] Error parsing mock DB', e);
        }
    }

    return firebaseOnSnapshot(query, (snapshot) => {
        onNext(snapshot as any);
    }, onError);
};
