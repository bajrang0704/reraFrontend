"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProjectRedirectPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (user && user.loginId) {
                // Use projectId from user object (e.g. TSRERA/...)
                const encodedId = encodeURIComponent(user.loginId);
                router.replace(`/project/${encodedId}/status`);
            } else if (user && user.id) {
                // Fallback to user.id if projectId missing (shouldn't happen for Project Users)
                // But user explicitly said "You are using the user.id... instead of projectId"
                // So we strictly prefer projectId.
                // If it's a System Admin, they might not have a projectId.
                if (user.role === "SYSTEM_ADMIN") {
                    router.replace("/admin");
                } else {
                    // Try id but warn
                    console.warn("No projectId found on user, using id");
                    const encodedId = encodeURIComponent(user.id);
                    router.replace(`/project/${encodedId}/status`);
                }
            } else {
                // If no user, redirect to login
                router.replace("/login");
            }
        }
    }, [user, isLoading, router]);

    return (
        <div className="flex items-center justify-center h-screen">
            <p>Redirecting to project dashboard...</p>
        </div>
    );
}
