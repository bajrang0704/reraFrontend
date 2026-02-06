"use client";

import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api, Project } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { RoleGuard } from "@/components/auth/RoleGuard";

interface ProjectDashboardProps {
    params: Promise<{ id: string }>;
}

// Schema for project editing - expand as needed based on "Show all project fields"
// Assuming standard fields for RERA project
const projectSchema = z.object({
    name: z.string().min(3),
    status: z.string(),
    location: z.string().optional(),
    description: z.string().optional(),
    // Add more fields here to match "Full project data"
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectDashboardPage(props: ProjectDashboardProps) {
    const params = use(props.params);
    const { id } = params;
    const { user } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
    });

    useEffect(() => {
        const fetchProject = async () => {
            try {
                if (!id) return;
                setLoading(true);
                // Need to decode if it was encoded in the URL (it is double encoded sometimes?)
                // Next.js usually decodes params. But our logic pushed encodedId. 
                // Let's decode just in case the ID contains %2F
                const decodedId = decodeURIComponent(id);
                const data = await api.getProjectById(decodedId);
                setProject(data);
                reset(data); // Populate form
            } catch (err) {
                console.error(err);
                setError("Failed to load project details or unauthorized.");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id, reset]);

    const canEdit = user && (
        user.role === "SYSTEM_ADMIN" ||
        (user.role === "EMPLOYEE" /* && isOwner? Check project.createdBy? */) ||
        (user.role === "PROJECT_VIEWER" /* && isOwnProject? Checked by API access mostly */)
    );
    // Note: Backend enforces strict ownership. Frontend can try to edit, API will 403.
    // We can optimistically check ownership if project data has `createdById`.

    const onSave = async (data: ProjectFormValues) => {
        try {
            const decodedId = decodeURIComponent(id);
            await api.updateProject(decodedId, data);
            setIsEditing(false);
            const updated = await api.getProjectById(decodedId);
            setProject(updated);
            reset(updated);
        } catch (err) {
            console.error(err);
            alert("Failed to update project");
        }
    };

    if (loading) return <div className="p-8">Loading project details...</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;
    if (!project) return <div className="p-8">Project not found.</div>;

    return (
        <RoleGuard allowedRoles={["SYSTEM_ADMIN", "EMPLOYEE", "PROJECT_VIEWER"]}>
            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">{project.name}</h1>
                    {canEdit && !isEditing && (
                        <Button onClick={() => setIsEditing(true)}>Edit Project</Button>
                    )}
                    {isEditing && (
                        <Button variant="secondary" onClick={() => { setIsEditing(false); reset(project); }}>Cancel</Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Project Name</label>
                                        <Input {...register("name")} />
                                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Status</label>
                                        <Input {...register("status")} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Location</label>
                                        <Input {...register("location")} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description</label>
                                        <Input {...register("description")} />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            </form>
                        ) : (
                            <dl className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <dt className="text-sm font-medium text-gray-500">Project ID</dt>
                                    <dd>{project.id}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                                    <dd>{project.status}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                                    <dd>{project.location || "-"}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                                    <dd>{project.description || "-"}</dd>
                                </div>
                            </dl>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RoleGuard>
    );
}
