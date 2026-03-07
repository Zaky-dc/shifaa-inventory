import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
const GUEST_USED_KEY = "shifaa_guest_used";

export function AuthProvider({ children }) {
    const [mode, setMode] = useState(null); // null = not logged in, "admin" = admin, "guest" = guest

    const loginAdmin = (password) => {
        if (password === ADMIN_PASSWORD) {
            setMode("admin");
            return true;
        }
        return false;
    };

    const loginGuest = () => {
        // Check if guest has already used their once-off trial
        if (localStorage.getItem(GUEST_USED_KEY)) {
            return { success: false, alreadyUsed: true };
        }
        localStorage.setItem(GUEST_USED_KEY, "true");
        setMode("guest");
        return { success: true };
    };

    const logout = () => setMode(null);

    return (
        <AuthContext.Provider value={{ mode, loginAdmin, loginGuest, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
