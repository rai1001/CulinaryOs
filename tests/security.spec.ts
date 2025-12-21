import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";

const RULES_PATH = resolve(__dirname, "../firestore.rules");
const PROJECT_ID = "kitchen-manager-v2-test";

describe("Firestore Security Rules", () => {
    let testEnv: any;

    beforeAll(async () => {
        testEnv = await initializeTestEnvironment({
            projectId: PROJECT_ID,
            firestore: {
                rules: readFileSync(RULES_PATH, "utf8"),
            },
        });
    });

    afterAll(async () => {
        await testEnv.cleanup();
    });

    beforeEach(async () => {
        await testEnv.clearFirestore();
    });

    // Helpers to get authenticated context
    const getContext = (auth: any) => testEnv.authenticatedContext(auth.uid, auth).firestore();
    const getAdminContext = () => getContext({ uid: "admin_uid", email: "admin@test.com" });

    // Setup User Helper
    const setupUser = async (uid: string, role: string, active: boolean, outlets: string[] = ['hq']) => {
        const adminDb = getAdminContext();
        // Only Admin can write arbitrary users with roles, so we bootstrap via admin
        await adminDb.collection("users").doc(uid).set({
            uid,
            role,
            active,
            allowedOutlets: outlets,
            defaultOutletId: outlets[0] || '',
            email: `${role}@test.com`
        });
    };

    it("1. Unauthenticated users should be denied access to everything", async () => {
        const db = testEnv.unauthenticatedContext().firestore();
        await assertFails(db.collection("ingredients").get());
        await assertFails(db.collection("purchaseOrders").add({ some: "data" }));
    });

    it("2. Active Viewer can READ same outlet but WRITE deny", async () => {
        const uid = "viewer_1";
        await setupUser("admin_uid", "admin", true, ["hq"]); // Setup admin first
        await setupUser(uid, "viewer", true, ["hq"]);

        const db = getContext({ uid });

        // Create data as admin
        const adminDb = getAdminContext();
        await adminDb.collection("ingredients").doc("ing_1").set({
            name: "Tomato",
            outletId: "hq"
        });
        await adminDb.collection("ingredients").doc("ing_2").set({
            name: "Potato",
            outletId: "other_outlet"
        });

        // Test Read
        await assertSucceeds(db.collection("ingredients").doc("ing_1").get()); // Same outlet
        await assertFails(db.collection("ingredients").doc("ing_2").get()); // Other outlet

        // Test Write
        await assertFails(db.collection("ingredients").doc("ing_1").update({ name: "Hacked" }));
    });

    it("3. Chef can WRITE recipes in same outlet but DENY other outlet", async () => {
        const uid = "chef_1";
        await setupUser("admin_uid", "admin", true, ["hq"]);
        await setupUser(uid, "chef", true, ["hq"]);

        const db = getContext({ uid });

        // Success Write
        await assertSucceeds(db.collection("recipes").add({
            name: "Soup",
            outletId: "hq"
        }));

        // Fail Write (wrong outlet)
        await assertFails(db.collection("recipes").add({
            name: "Soup Evil",
            outletId: "other"
        }));
    });

    it("4. Storekeeper can CREATE purchase orders", async () => {
        const uid = "store_1";
        await setupUser("admin_uid", "admin", true, ["hq"]);
        await setupUser(uid, "storekeeper", true, ["hq"]);

        const db = getContext({ uid });

        await assertSucceeds(db.collection("purchaseOrders").add({
            items: [],
            outletId: "hq"
        }));
    });

    it("5. User without Profile (Ghost) is DENIED everything", async () => {
        const db = getContext({ uid: "ghost_user" }); // No setupUser call
        await assertFails(db.collection("ingredients").get());
    });

    it("6. Inactive User is DENIED everything", async () => {
        await setupUser("admin_uid", "admin", true, ["hq"]);
        await setupUser("inactive_1", "chef", false, ["hq"]);

        const db = getContext({ uid: "inactive_1" });
        await assertFails(db.collection("recipes").get());
        await assertFails(db.collection("recipes").add({ outletId: 'hq' }));
    });

    it("7. Global Suppliers: Read OK (Active), Write DENY (Chef)", async () => {
        await setupUser("admin_uid", "admin", true, ["hq"]);
        await setupUser("chef_1", "chef", true, ["hq"]);

        const db = getContext({ uid: "chef_1" });

        // Read
        await assertSucceeds(db.collection("suppliers").doc("s1").get());

        // Write (Chef cannot manage suppliers, only Manager/Admin)
        // Check rules: match /suppliers/{supplierId} write: isManager()
        await assertFails(db.collection("suppliers").add({ name: "New One" }));
    });

    it("8. Immutable OutletId: Cannot change outletId on update", async () => {
        await setupUser("admin_uid", "admin", true, ["hq"]);
        await setupUser("chef_1", "chef", true, ["hq"]);

        const adminDb = getAdminContext();
        await adminDb.collection("recipes").doc("r1").set({
            name: "Base",
            outletId: "hq"
        });

        const db = getContext({ uid: "chef_1" });

        // Try to move recipe to another outlet
        await assertFails(db.collection("recipes").doc("r1").update({
            outletId: "other"
        }));

        // Normal update OK
        await assertSucceeds(db.collection("recipes").doc("r1").update({
            name: "Base Updated"
        }));
    });

});
