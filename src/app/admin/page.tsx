"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { useEffect, useState } from "react";
import { api, Group, Company, Project, User } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/Button";

type Tab = "groups" | "companies" | "projects" | "users";

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<Tab>("groups");

    // State for data
    const [groups, setGroups] = useState<Group[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch data on tab change
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === "groups") {
                    const data = await api.getGroups();
                    setGroups(data);
                } else if (activeTab === "companies") {
                    const data = await api.getCompanies();
                    setCompanies(data);
                } else if (activeTab === "projects") {
                    const data = await api.getAllProjects();
                    setProjects(data);
                } else if (activeTab === "users") {
                    const data = await api.getUsers();
                    setUsers(data);
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    // Columns
    const groupColumns: ColumnDef<Group>[] = [
        { accessorKey: "name", header: "Group Name" },
        { id: "actions", cell: () => <Button size="sm" variant="outline">Edit</Button> }
    ];

    const companyColumns: ColumnDef<Company>[] = [
        { accessorKey: "name", header: "Company Name" },
        { id: "actions", cell: () => <Button size="sm" variant="outline">Edit</Button> }
    ];

    const projectColumns: ColumnDef<Project>[] = [
        { accessorKey: "name", header: "Project Name" },
        { accessorKey: "status", header: "Status" },
        {
            id: "actions", cell: ({ row }) => (
                <Button size="sm" variant="outline" onClick={() => window.location.href = `/project/${row.original.id}`}>Manage</Button>
            )
        }
    ];

    const userColumns: ColumnDef<User>[] = [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "email", header: "Email" },
        { accessorKey: "role", header: "Role" },
        { id: "actions", cell: () => <Button size="sm" variant="outline">Edit</Button> }
    ];

    const renderContent = () => {
        if (loading) return <div>Loading...</div>;

        switch (activeTab) {
            case "groups":
                return <DataTable columns={groupColumns} data={groups} />;
            case "companies":
                return <DataTable columns={companyColumns} data={companies} />;
            case "projects":
                return <DataTable columns={projectColumns} data={projects} />;
            case "users":
                return <DataTable columns={userColumns} data={users} />;
            default:
                return null;
        }
    };

    return (
        <RoleGuard allowedRoles={["SYSTEM_ADMIN"]}>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

                <div className="flex gap-4 mb-6 border-b pb-2">
                    {(["groups", "companies", "projects", "users"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            className={`px-4 py-2 font-medium capitalize ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
                    {/* Generic Create Button - In real app, would open specific modal/form */}
                    <Button>Create New {activeTab.slice(0, -1)}</Button>
                </div>

                {renderContent()}
            </div>
        </RoleGuard>
    );
}
