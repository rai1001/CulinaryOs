import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, type User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useStore } from '../../store/useStore';
import { ShieldCheck, Lock, LogOut, Store } from 'lucide-react';

interface AuthWrapperProps {
    children: React.ReactNode;
}

interface UserProfile {
    uid: string;
    email: string;
    role: string;
    active: boolean;
    allowedOutlets: string[];
    defaultOutletId?: string;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { setActiveOutletId } = useStore();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (!currentUser) {
                setLoading(false);
                setUserProfile(null);
                return;
            }

            // Subscribe to user profile in Firestore
            const userRef = doc(db, 'users', currentUser.uid);

            const unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as UserProfile;
                    setUserProfile(data);

                    // Set default outlet if available and not set
                    if (data.defaultOutletId && data.active) {
                        // We could check if current store has it, but syncing handles that.
                        // Just ensuring we have an active outlet ID in store for logic
                        setActiveOutletId(data.defaultOutletId);
                    }
                } else {
                    // Provisioning Logic: Create doc if missing
                    console.log("Provisioning new user...");
                    try {
                        const newProfile = {
                            uid: currentUser.uid,
                            email: currentUser.email || '',
                            displayName: currentUser.displayName || '',
                            role: 'viewer',
                            active: false,
                            allowedOutlets: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };

                        await setDoc(userRef, newProfile);
                        // Snapshot listener will catch the update
                    } catch (err) {
                        console.error("Error provisioning user:", err);
                        setError("Error creando perfil de usuario. Contacte al administrador.");
                    }
                }
                setLoading(false);
            }, (err) => {
                console.error("Profile sync error:", err);
                // If permission denied, it likely means they are not active or role issue?
                // Or rules prevent reading own doc? (Should not happen with our rules)
                setError("No se pudo cargar el perfil. Verifique su conexión o permisos.");
                setLoading(false);
            });

            return () => unsubscribeProfile();
        });

        return () => unsubscribeAuth();
    }, []);

    const handleLogin = async () => {
        try {
            const auth = getAuth();
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Login error:", err);
            setError("Error al iniciar sesión.");
        }
    };

    const handleLogout = () => {
        getAuth().signOut();
    };

    if (loading) {
        return (
            <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // State 1: Not Authenticated
    if (!user) {
        return (
            <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="bg-surface p-8 rounded-2xl border border-white/10 max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-indigo-400" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Kitchen Manager V2</h1>
                    <p className="text-slate-400">Inicie sesión para acceder al sistema de gestión.</p>
                    <button
                        onClick={handleLogin}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <ShieldCheck size={20} />
                        Iniciar con Google
                    </button>
                </div>
            </div>
        );
    }

    // State 2: Error
    if (error) {
        return (
            <div className="h-screen w-screen bg-slate-900 flex items-center justify-center">
                <div className="text-red-400 bg-red-900/20 p-6 rounded-xl border border-red-500/20 max-w-md text-center">
                    <p className="font-bold mb-2">Error de Acceso</p>
                    <p>{error}</p>
                    <button onClick={handleLogout} className="mt-4 text-sm text-slate-400 hover:text-white underline">Cerrar Sesión</button>
                </div>
            </div>
        );
    }

    // State 3: Provisioned but Inactive
    if (userProfile && !userProfile.active) {
        return (
            <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="bg-surface p-8 rounded-2xl border border-red-500/20 max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="text-red-400" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Cuenta Desactivada</h2>
                    <p className="text-slate-400">
                        Su cuenta se ha creado correctamente pero está <strong>pendiente de activación</strong> por un administrador.
                    </p>
                    <div className="bg-black/20 p-4 rounded-lg text-left text-sm space-y-2 font-mono text-slate-300">
                        <p>UID: {user.uid}</p>
                        <p>Email: {user.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-white mx-auto"
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    // State 4: Active but No Outlets
    if (userProfile && (userProfile.allowedOutlets || []).length === 0 && userProfile.role !== 'admin') {
        return (
            <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="bg-surface p-8 rounded-2xl border border-yellow-500/20 max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
                        <Store className="text-yellow-400" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Sin Asignación</h2>
                    <p className="text-slate-400">
                        Su usuario no tiene cocinas (outlets) asignadas. Contacte a su manager.
                    </p>
                    <button
                        onClick={handleLogout}
                        className="mt-4 flex items-center justify-center gap-2 text-slate-400 hover:text-white mx-auto"
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    // Happy Path
    return <>{children}</>;
};
