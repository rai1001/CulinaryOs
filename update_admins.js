const admin = require('firebase-admin');

// Initialize with default credentials (should work if logged in via CLI)
admin.initializeApp({
    projectId: 'culinaryos-6794e'
});

const db = admin.firestore();

async function grantAdmin(uid, email) {
    const userRef = db.collection('users').doc(uid);
    const profile = {
        uid: uid,
        email: email,
        role: 'admin',
        active: true,
        allowedOutlets: [],
        updatedAt: new Date().toISOString()
    };

    await userRef.set(profile, { merge: true });
    console.log(`Granted admin to ${uid} (${email})`);
}

const uids = [
    { uid: 'KHOxOqvfW9QRAvVdanb8UTpEMsl2', email: 'admin1@culinaryos.com' },
    { uid: 'j9hrlnFKHYXQf54fuhVFV7Ywfnl2', email: 'admin2@culinaryos.com' }
];

async function main() {
    for (const user of uids) {
        await grantAdmin(user.uid, user.email);
    }
}

main().catch(console.error);
