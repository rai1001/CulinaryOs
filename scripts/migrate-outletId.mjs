import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';

// Usage: node scripts/migrate-outletId.mjs <serviceAccountPath> <defaultOutletId>

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node scripts/migrate-outletId.mjs <serviceAccountPath> <defaultOutletId>');
    console.error('Example: node scripts/migrate-outletId.mjs ./sa.json HEADQUARTERS');
    process.exit(1);
}

const [serviceAccountPath, defaultOutletId] = args;

const COLLECTIONS_TO_MIGRATE = [
    'ingredients',
    'recipes',
    'menus',
    'events',
    'purchaseOrders',
    'wasteRecords',
    // 'staff' - handled separately or same way
    'schedule',
    'haccpLogs'
];

async function main() {
    try {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

        if (getApps().length === 0) {
            initializeApp({
                credential: cert(serviceAccount)
            });
        }

        const db = getFirestore();
        const report = {
            migrated: {},
            errors: []
        };

        for (const colName of COLLECTIONS_TO_MIGRATE) {
            console.log(`Analyzing collection: ${colName}...`);
            const snap = await db.collection(colName).get();
            let count = 0;

            const batchSize = 500;
            let batch = db.batch();
            let batchCount = 0;

            for (const doc of snap.docs) {
                const data = doc.data();
                if (!data.outletId) {
                    batch.update(doc.ref, { outletId: defaultOutletId });
                    count++;
                    batchCount++;
                }

                if (batchCount >= batchSize) {
                    await batch.commit();
                    batch = db.batch();
                    batchCount = 0;
                }
            }

            if (batchCount > 0) {
                await batch.commit();
            }

            console.log(`  -> Migrated ${count} docs in ${colName}`);
            report.migrated[colName] = count;
        }

        writeFileSync('migration-report.json', JSON.stringify(report, null, 2));
        console.log('✅ Migration complete. See migration-report.json');

    } catch (error) {
        console.error('❌ ERROR:', error);
        process.exit(1);
    }
}

main();
