"use client";

import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/config/routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login");
            } else if (!allowedRoles.includes(user.role)) {
                // Redirect to their own home or show unauthorized
                // For now, redirect to their home to be safe, or just stay/show error.
                // Requirement: "On 403... show 'Not authorized or not found'"
                // But if they are just on the wrong page, maybe redirecting them to their correct dashboard is better?
                // Actually, if I try to access /admin as employee, I should see 403.
                // But for UX, let's just render Forbidden state.
            }
        }
    }, [user, isLoading, allowedRoles, router]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return null; // Will redirect
    }

    if (!allowedRoles.includes(user.role)) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">403 - Not Authorized</h1>
                    <p>You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
