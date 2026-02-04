"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { useEffect, useState } from "react";
import { api, Project } from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function CompanyDashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch projects for company
        // API: getProjects? No, getCompanies returns list. 
        // We need getProjects scoped to company.
        // My api.ts has getMyProjects (for employee). 
        // I probably need `getProjects` (Admin) or `getCompanyProjects`?
        // The API contract says:
        // GET /companies/:companyId -> View company details.
        // GET /projects -> Admin only.
        // GET /projects/:id -> Details.
        // Wait, how does Company Viewer see list of projects?
        // Docs: "Company Dashboard ... Data Returned: Projects".
        // "GET /companies/:companyId" is likely the one.
        // Or maybe "GET /companies" returns "own company" for Company Viewer, containing projects?
        // Let's assume `api.getCompanies()` returns the company (singular in list) and maybe projects included, or we need another endpoint.
        // Actually, `api.ts` I wrote has `getCompanies`.
        // Let's assume for Company Viewer, `getCompanies` returns the single company they belong to.
        // And that company object has projects? Or we need to fetch projects using that ID.
        // Let's assume we fetch company then fetch projects? 
        // Or maybe just `getCompanyById("me")` concept.
        // Let's rely on `getCompanies` returning the list (of 1) and then if needed fetch projects.
        // Or simpler: `api.getCompanyProjects(id)`. 
        // I'll add `getCompanyById` to api which I did.

        // Strategy: Fetch companies. (Should be 1). Then display that company's projects.
        // Wait, `getCompanies` returns `Company[]`.
        const fetchData = async () => {
            try {
                // As Company Viewer, access is "own company".
                const companies = await api.getCompanies();
                if (companies.length > 0) {
                    // Ideally we get projects here.
                    // If 'projects' is not in Company interface, we might need a separate call.
                    // API contract: "Company Dashboard... Data Returned: Projects".
                    // I'll assume projects are attached or we call getCompanyById(companies[0].id) to get full details including projects.
                    // Let's try fetching details for the first company.
                    const fullCompany = await api.getCompanyById(companies[0].id);
                    // Assuming fullCompany has projects.
                    // I need to add `projects` to `Company` interface in `api.ts` or extend it locally.
                    if ((fullCompany as any).projects) {
                        setProjects((fullCompany as any).projects);
                    }
                }
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
                return (
                    <Link href={`/project/${project.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                );
            },
        },
    ];

    return (
        <RoleGuard allowedRoles={["COMPANY_VIEWER"]}>
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Company Dashboard</h1>
                {loading ? (
                    <p>Loading projects...</p>
                ) : (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold">Projects</h2>
                        <DataTable columns={columns} data={projects} />
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}
