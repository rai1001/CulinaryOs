import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Usage: node scripts/bootstrap-admin.mjs <serviceAccountPath> <email> <uid>

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error('Usage: node scripts/bootstrap-admin.mjs <serviceAccountPath> <email> <uid>');
    process.exit(1);
}

const [serviceAccountPath, email, uid] = args;

try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    if (getApps().length === 0) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    }

    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);

    const userData = {
        uid: uid,
        email: email,
        displayName: 'Mega Admin',
        role: 'admin',
        active: true,
        allowedOutlets: ['HEADQUARTERS'],
        defaultOutletId: 'HEADQUARTERS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await userRef.set(userData, { merge: true });

    // Also create the HQ outlet if it doesn't exist
    const outletRef = db.collection('outlets').doc('HEADQUARTERS');
    await outletRef.set({
        id: 'HEADQUARTERS',
        name: 'Sede Central',
        type: 'main_kitchen',
        isActive: true,
        address: 'Admin Created'
    }, { merge: true });

    console.log(`✅ SUCCESS: Admin user ${email} (${uid}) bootstrapped.`);
    console.log(`✅ SUCCESS: Ensured outlet 'HEADQUARTERS' exists.`);

} catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
}
