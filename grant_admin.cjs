const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Since we are running in a terminal where the user is likely logged in
// We can try to use the Firebase CLI's environment or just a dummy config
// if we're using the admin SDK. But admin SDK is not installed.
// The client SDK might need an API Key.

// Let's try to see if we can use the FIREBASE CLI to just set the data.
// Actually, 'firebase firestore:set' isn't a cosa.

// Plan C: Use a shell command to write a JSON file and use a tool if possible.
// But there's no 'firestore_import' tool.

// Plan D: Install firebase-admin. It's safe and fast for a one-off.
const execSync = require('child_process').execSync;
console.log("Installing firebase-admin...");
try {
    execSync('npm install firebase-admin', { stdio: 'inherit' });
    console.log("Installation successful.");

    const admin = require('firebase-admin');
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

    uids.reduce((p, user) => p.then(() => grantAdmin(user.uid, user.email)), Promise.resolve())
        .then(() => console.log("All done."))
        .catch(console.error);

} catch (e) {
    console.error("Failed to install or run:", e);
}
