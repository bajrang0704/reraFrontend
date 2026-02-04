"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, User } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ROLE_HOME } from "@/config/routes";
import { setToken } from "@/lib/axios";

const AUTH_STORAGE_KEY = "rera_auth";

interface AuthContextType {
    user: User | null;
    login: (data: any) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const router = useRouter();

    // Restore session on mount - useEffect only runs on client
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
            if (stored) {
                const { user: storedUser, token } = JSON.parse(stored);
                if (storedUser && token) {
                    setToken(token);
                    setUser(storedUser);
                }
            }
        } catch (error) {
            console.error("Failed to restore session:", error);
        } finally {
            setIsInitializing(false);
        }
    }, []);

    const login = async (data: any) => {
        setIsLoading(true);
        try {
            const response = await api.login(data);
            setUser(response.user);
            // Persist session
            try {
                sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                    user: response.user,
                    token: response.accessToken,
                }));
            } catch (e) {
                console.error("Failed to save session:", e);
            }
            // Determine redirect
            const redirectPath = ROLE_HOME[response.user.role];
            if (redirectPath) {
                router.push(redirectPath);
            } else {
                console.error("Unknown role:", response.user.role);
            }
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        try {
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
        } catch (e) {
            // Ignore storage errors
        }
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, isInitializing }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
