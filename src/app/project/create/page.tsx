"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";

const createProjectSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    description: z.string().optional(),
    // Add other required fields for creation
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export default function CreateProjectPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateProjectFormValues>({
        resolver: zodResolver(createProjectSchema),
    });

    const onSubmit = async (data: CreateProjectFormValues) => {
        try {
            await api.createProject(data);
            router.push("/employee"); // Back to dashboard
        } catch (err) {
            console.error(err);
            alert("Failed to create project");
        }
    };

    return (
        <RoleGuard allowedRoles={["EMPLOYEE", "SYSTEM_ADMIN"]}>
            <div className="flex justify-center p-8">
                <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>Create New Project</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Project Name</label>
                                <Input {...register("name")} placeholder="Enter project name" />
                                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input {...register("description")} placeholder="Project description" />
                            </div>

                            <div className="flex justify-end pt-4 gap-2">
                                <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>Create Project</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </RoleGuard>
    );
}
