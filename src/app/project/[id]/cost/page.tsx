"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, SubmitHandler, Controller } from "react-hook-form";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    MenuItem,
    CircularProgress,
    Alert,
    Snackbar,
} from "@mui/material";
import { projectApi } from "@/lib/api/project";
import { profileApi } from "@/lib/api/profile";
import { useAuth } from "@/context/AuthContext";
import { Project, CostHead, ProjectCost } from "@/types/project";

interface CostRow extends CostHead {
    estimatedAmount: number;
    actualAmount: number;
}

interface CostForm {
    projectUuid: string;
    costs: CostRow[];
}

export default function ProjectCostPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [costHeads, setCostHeads] = useState<CostHead[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [totals, setTotals] = useState<{ estimated: number, actual: number }>({ estimated: 0, actual: 0 });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const { control, handleSubmit, register, reset, setValue, watch, formState: { errors } } = useForm<CostForm>({
        defaultValues: {
            projectUuid: "",
            costs: [],
        }
    });

    const { fields, replace } = useFieldArray({
        control,
        name: "costs",
    });

    // Load Projects and Cost Heads
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user?.loginId) return;
            try {
                setLoading(true);

                // 1. Fetch Profile and Projects
                const profileRes = await profileApi.getProfile(user.loginId);
                const profileId = (profileRes as any).data?.id || (profileRes as any).profile?.id;

                if (profileId) {
                    const projectList = await projectApi.listProjects(profileId);
                    setProjects(projectList);
                }

                // 2. Fetch Cost Headers (Metadata)
                console.log("DEBUG: Fetching Cost Heads...");
                const heads = await projectApi.getCostHeads();
                console.log("DEBUG: Cost Heads Fetched:", heads);

                // Sort by displayOrder
                heads.sort((a, b) => a.displayOrder - b.displayOrder);
                setCostHeads(heads);

            } catch (err: any) {
                console.error("Failed to load initial data", err);
                console.log("DEBUG: Error Details:", err.response?.data || err.message);
                setSnackbar({ open: true, message: "Failed to load initial data: " + (err.response?.data?.message || err.message), severity: "error" });
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [user?.loginId]);

    // Handle Project Selection
    const handleProjectChange = async (projectUuid: string) => {
        if (!projectUuid) {
            setSelectedProject(null);
            setValue("projectUuid", "");
            replace([]);
            return;
        }

        try {
            setLoading(true);
            const project = projects.find(p => p.id === projectUuid);
            setSelectedProject(project || null);
            setValue("projectUuid", projectUuid);

            // Fetch Saved Costs
            // Backend expects Display ID usually, but sticking to UUID if API allows. 
            // Standardizing on 'project.projectId || project.id' as per other pages.
            // Fetch Saved Costs
            // Backend expects Display ID usually, but sticking to UUID if API allows. 
            // Standardizing on 'project.projectId || project.id' as per other pages.
            const apiProjectId = project?.projectId || project?.id || projectUuid;

            const response = await projectApi.getProjectCosts(apiProjectId);
            const savedCosts = response.costs || [];

            // Set Totals (Backend provided)
            setTotals({
                estimated: response.totalEstimatedCost || 0,
                actual: response.totalActualCost || 0
            });

            // Merge Metadata (CostHeads) with Saved Values
            const mergedCosts: CostRow[] = costHeads.map(head => {
                const saved = savedCosts.find(c => c.costHeadCode === head.code);
                return {
                    ...head,
                    estimatedAmount: saved?.estimatedAmount || 0,
                    actualAmount: saved?.actualAmount || 0,
                };
            });

            replace(mergedCosts);

        } catch (err) {
            console.error("Failed to load project costs", err);
            setSnackbar({ open: true, message: "Failed to load project costs", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const onSubmit: SubmitHandler<CostForm> = async (data) => {
        if (!selectedProject) return;
        try {
            setLoading(true);
            const apiProjectId = selectedProject.projectId || selectedProject.id;

            // Transform UI data back to API format (ProjectCost[])
            // Filter out 0/0 entries? No, usually we save all if they are edited. 
            // Or validation says "Required"? 
            // We will send all rows corresponding to heads.

            const payload: ProjectCost[] = data.costs.map(row => ({
                costHeadCode: row.code,
                estimatedAmount: Number(row.estimatedAmount),
                actualAmount: Number(row.actualAmount),
            }));

            await projectApi.saveProjectCosts(apiProjectId, payload);
            setSnackbar({ open: true, message: "Project costs saved successfully", severity: "success" });

        } catch (err: any) {
            console.error("Failed to save costs", err);
            const msg = err.response?.data?.error || err.message || "Failed to save costs";
            setSnackbar({ open: true, message: msg, severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 1, borderBottom: "2px solid #ccc", pb: 1, color: "#0d47a1" }}>
                Add Project Cost
            </Typography>

            <Typography variant="caption" color="error" sx={{ mb: 3, display: 'block' }}>
                All * Mark field are mandatory.
            </Typography>

            {/* Project Selection */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Controller
                    name="projectUuid"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            fullWidth
                            label="Project Name *"
                            onChange={(e) => {
                                field.onChange(e);
                                handleProjectChange(e.target.value);
                            }}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        >
                            <MenuItem value="">Select Project</MenuItem>
                            {projects.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.projectName}</MenuItem>
                            ))}
                        </TextField>
                    )}
                />
            </Paper>

            {selectedProject && (
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <TableContainer component={Paper} elevation={2}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: "#5d99c6" }}>
                                <TableRow>
                                    <TableCell sx={{ color: "white", fontWeight: "bold", width: "5%" }}>Sr. No</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: "bold", width: "55%" }}>Particular</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: "bold", width: "20%" }}>Estimated Total Amount (in INR)</TableCell>
                                    <TableCell sx={{ color: "white", fontWeight: "bold", width: "20%" }}>Actual Total Amount (in INR)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {fields.map((field, index) => {
                                    // Grouping / Section Headers logic can be added here if needed.
                                    // For now, simpler list as per API list.

                                    // Check if we need to render a section header? 
                                    // The API sort order usually handles grouping.
                                    // We'll just render flat list for now or check previous item section.

                                    const showSectionHeader = index === 0 || fields[index - 1].section !== field.section;

                                    return (
                                        <React.Fragment key={field.id}>
                                            {showSectionHeader && (
                                                <TableRow sx={{ bgcolor: "#e3f2fd" }}>
                                                    <TableCell colSpan={4} sx={{ fontWeight: "bold" }}>
                                                        {field.section === "LAND_COST" ? "1. Land Cost" :
                                                            field.section === "DEVELOPMENT_COST" ? "2. Development Cost/ Cost of Construction" :
                                                                field.section}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            <TableRow hover>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{field.label}</TableCell>
                                                <TableCell>
                                                    <TextField
                                                        {...register(`costs.${index}.estimatedAmount`)}
                                                        type="number"
                                                        size="small"
                                                        fullWidth
                                                        InputProps={{ inputProps: { min: 0 } }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        {...register(`costs.${index}.actualAmount`)}
                                                        type="number"
                                                        size="small"
                                                        fullWidth
                                                        InputProps={{ inputProps: { min: 0 } }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    );
                                })}
                                {fields.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                            {loading ? <CircularProgress size={24} /> : "No Cost Heads Found"}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {/* Totals Row */}
                                <TableRow sx={{ bgcolor: "#eee", fontWeight: "bold" }}>
                                    <TableCell colSpan={2} sx={{ textAlign: "right", fontWeight: "bold" }}>
                                        Total Cost of the Real Estate Project:
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>
                                        {totals.estimated.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: "bold" }}>
                                        {totals.actual.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </TableCell>
                                </TableRow>

                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mt: 3 }}>
                        <Button type="submit" variant="contained" color="success" size="large" disabled={loading}>
                            Save
                        </Button>
                    </Box>
                </Box>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
