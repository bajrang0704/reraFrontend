"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { useEffect, useState } from "react";
import { api, Project } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function EmployeeDashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch my projects
        const fetchData = async () => {
            try {
                const data = await api.getMyProjects();
                setProjects(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const columns: ColumnDef<Project>[] = [
        {
            accessorKey: "name",
            header: "Project Name",
        },
        {
            accessorKey: "status",
            header: "Status",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const project = row.original;
                // Employee can edit owned projects.
                // Assuming getMyProjects returns ONLY owned projects.
                return (
                    <div className="flex gap-2">
                        <Link href={`/project/${project.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                        </Link>
                        {/* If employee is owner (implied by 'my projects') they can edit details IN the project dashboard or here? 
                Project Dashboard allows editing. So View is sufficient. */}
                    </div>
                );
            },
        },
    ];

    return (
        <RoleGuard allowedRoles={["EMPLOYEE"]}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Employee Dashboard</h1>
                    <Link href="/project/create">
                        <Button>Create Project</Button>
                    </Link>
                </div>

                {loading ? (
                    <p>Loading your projects...</p>
                ) : (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">My Projects</h2>
                        <DataTable columns={columns} data={projects} />
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}
