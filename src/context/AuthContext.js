import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Load user only from sessionStorage (NOT shared between tabs)
    const [user, setUser] = useState(() => {
        const savedUser = sessionStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Login
    const login = (userData) => {
        sessionStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    // Logout
    const logout = () => {
        sessionStorage.removeItem("user");
        setUser(null);
    };

    // Keep sessionStorage updated if user changes
    useEffect(() => {
        if (user) {
            sessionStorage.setItem("user", JSON.stringify(user));
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook
export const useAuth = () => useContext(AuthContext);
