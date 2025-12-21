const admin = require('firebase-admin');

async function run() {
    console.log("Starting activation...");
    try {
        admin.initializeApp({
            projectId: 'culinaryos-6794e'
        });
        const db = admin.firestore();
        const uid = 'KHOxOqvfW9QRAvVdanb8UTpEMsl2';

        console.log("Attempting to update document...");
        const userRef = db.collection('users').doc(uid);

        // Check if it exists first
        const doc = await userRef.get();
        if (!doc.exists) {
            console.log("Document does not exist! Creating instead of updating.");
            await userRef.set({
                uid: uid,
                email: 'raisada1001@gmail.com',
                role: 'admin',
                active: true,
                allowedOutlets: [],
                updatedAt: new Date().toISOString()
            });
        } else {
            await userRef.update({
                role: 'admin',
                active: true,
                updatedAt: new Date().toISOString()
            });
        }

        console.log("Success! User elevated.");
    } catch (err) {
        console.error("CRITICAL ERROR:");
        console.error(err.message);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    }
}

run();
