"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { profileApi } from "@/lib/api/profile";

interface NavItem {
    href: string;
    label: string;
    subItems?: { href: string; label: string }[];
}

const baseAccountNav: NavItem[] = [
    {
        href: "/account",
        label: "Account",
        subItems: [
            { href: "/account/profile", label: "My Profile" },
            { href: "/account/org-members", label: "Add Organization Other Member Details" },
            { href: "/account/past-experience", label: "Past Experience Details" },
        ],
    },
];

export function AccountSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [showOrgMembers, setShowOrgMembers] = useState(false);

    useEffect(() => {
        if (user?.loginId) {
            profileApi.getProfile(user.loginId)
                .then(res => {
                    // Handle different response structures
                    const p = (res as any).data || res.profile;
                    if (p) {
                        // Check for new structure: profileType + entityType
                        // OR old structure: informationType + organizationType
                        const profileType = p.profileType || p.informationType || p.infoType;
                        const entityType = p.entityType || p.organizationType || p.orgType;

                        // Also check nested organizationDetails
                        const orgDetails = p.organizationDetails;
                        const nestedEntityType = orgDetails?.entityType || orgDetails?.organizationType;

                        const isOtherThanIndividual = profileType === "OTHER_THAN_INDIVIDUAL" || profileType === "ORGANIZATION";
                        const isOthersType = entityType === "OTHERS" || nestedEntityType === "OTHERS";

                        if (isOtherThanIndividual && isOthersType) {
                            setShowOrgMembers(true);
                        } else {
                            setShowOrgMembers(false);
                        }
                    } else {
                        setShowOrgMembers(false);
                    }
                })
                .catch(() => {
                    setShowOrgMembers(false);
                });
        }
    }, [user?.loginId]);

    const navItems = baseAccountNav.map(item => ({
        ...item,
        subItems: item.subItems?.filter(subItem => {
            if (subItem.href === "/account/org-members") {
                return showOrgMembers;
            }
            return true;
        })
    }));

    return (
        <aside className="w-64 bg-gray-50 border-r min-h-screen p-4">
            <nav className="space-y-2">
                {navItems.map((item) => (
                    <div key={item.href}>
                        <div className="font-semibold text-sm text-gray-700 mb-2">{item.label}</div>
                        {item.subItems && (
                            <ul className="space-y-1 pl-2">
                                {item.subItems.map((subItem) => (
                                    <li key={subItem.href}>
                                        <Link
                                            href={subItem.href}
                                            className={cn(
                                                "block px-3 py-2 rounded-md text-sm transition-colors",
                                                pathname === subItem.href
                                                    ? "bg-blue-100 text-blue-700 font-medium"
                                                    : "text-gray-600 hover:bg-gray-100"
                                            )}
                                        >
                                            {subItem.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
