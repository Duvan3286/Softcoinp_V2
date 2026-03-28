"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import { permissionsService } from "@/services/permissionsService";

interface AuthContextType {
    user: UserPayload | null;
    permissions: string[];
    hasPermission: (key: string) => boolean;
    refreshPermissions: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserPayload | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshPermissions = async () => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        
        if (currentUser?.id) {
            try {
                const perms = await permissionsService.getUserPermissions(currentUser.id);
                setPermissions(perms);
            } catch (error) {
                console.error("Error al cargar permisos:", error);
            }
        } else {
            setPermissions([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshPermissions();
    }, []);

    const hasPermission = (key: string) => {
        if (user?.role === "superadmin") return true;
        return permissions.includes(key);
    };

    return (
        <AuthContext.Provider value={{ user, permissions, hasPermission, refreshPermissions, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }
    return context;
}
