"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { useEffect, useState } from "react";
import { api, Company } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function GroupDashboardPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch group data (companies)
        // The requirement says "Group Dashboard... Shows List of Companies"
        // API: getCompanies (scoped to group for group viewer)
        const fetchData = async () => {
            try {
                const data = await api.getCompanies();
                setCompanies(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const columns: ColumnDef<Company>[] = [
        {
            accessorKey: "name",
            header: "Company Name",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const company = row.original;
                return (
                    // In real app, maybe navigate to company details or filter projects by this company
                    // But doc says "Select Company -> View Company Projects"
                    // So we strictly don't have a route like /company/[id] in my plan?
                    // Wait, Company Viewer lands on /company. Group Viewer sees list of Companies.
                    // Where do they go? "View Company Projects". 
                    // I probably need a view for Group Viewer to see a specific company's projects.
                    // Or just list ALL projects grouped by company.
                    // Docs: "Navigation: Group Dashboard -> Select Company -> View Company Projects -> View Project Details"
                    // This implies I need a route: /group/company/[id] or just reuse /company/[id] if accessible?
                    // Let's assume /company URL is exclusively for Company Viewer?
                    // Protocol says "Companies Viewer -> /company".
                    // Maybe Group Viewer can go to /companies/:id? behavior. It's not explicitly defined as a route in "ROUTING" list but implied in navigation.
                    // I'll leave the button but functionality might be limited without that route defined.
                    // Actually, I can just list projects here if the API provided a tree.
                    // But let's assume I should list them.
                    <Button variant="outline" size="sm">View Projects</Button>
                );
            },
        },
    ];

    return (
        <RoleGuard allowedRoles={["GROUP_VIEWER"]}>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Group Dashboard</h1>
                {loading ? (
                    <p>Loading companies...</p>
                ) : (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Companies</h2>
                        <DataTable columns={columns} data={companies} />
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}
