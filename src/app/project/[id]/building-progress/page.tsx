"use client";

import React, { useEffect, useState, use } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    MenuItem,
    Snackbar,
    Alert,
} from "@mui/material";
import { projectApi } from "@/lib/api/project";
import { Project, Building, BuildingTaskMaster, BuildingTaskProgress } from "@/types/project";
import { useAuth } from "@/context/AuthContext";
import { profileApi } from "@/lib/api/profile";

export default function BuildingTaskProgressPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();

    // State
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedBuilding, setSelectedBuilding] = useState<string>("");

    const [taskMasters, setTaskMasters] = useState<BuildingTaskMaster[]>([]);
    const [progress, setProgress] = useState<BuildingTaskProgress[]>([]);

    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Fetch Initial Data
    useEffect(() => {
        const init = async () => {
            if (!user?.loginId) return;
            try {
                setLoading(true);
                // Load Task Masters
                const masters = await projectApi.getBuildingTaskMasters();
                setTaskMasters(masters.sort((a, b) => a.displayOrder - b.displayOrder));

                // Load Projects
                const profileRes = await profileApi.getProfile(user.loginId);
                const profileId = (profileRes as any).data?.id || (profileRes as any).profile?.id;
                if (profileId) {
                    const projectList = await projectApi.listProjects(profileId);
                    setProjects(projectList);

                    const decodedId = decodeURIComponent(id);
                    const current = projectList.find(p => p.id === decodedId || p.projectId === decodedId);
                    if (current) {
                        setSelectedProject(current);
                        // Fetch Buildings for this project
                        const buildList = await projectApi.listBuildings(current.projectId || current.id);
                        setBuildings(buildList);
                    }
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [user?.loginId, id]);

    const handleProjectChange = async (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        setSelectedProject(project || null);
        setSelectedBuilding("");
        setProgress([]);

        if (project) {
            try {
                const buildList = await projectApi.listBuildings(project.projectId || project.id);
                setBuildings(buildList);
            } catch (err) {
                console.error("Failed to fetch buildings", err);
            }
        } else {
            setBuildings([]);
        }
    };

    const handleBuildingChange = async (buildingId: string) => {
        setSelectedBuilding(buildingId);
        if (buildingId && selectedProject) {
            try {
                setLoading(true);
                const currentProgress = await projectApi.getBuildingProgress(selectedProject.projectId || selectedProject.id, buildingId);
                setProgress(currentProgress);
            } catch (err) {
                console.error("Failed to fetch progress", err);
            } finally {
                setLoading(false);
            }
        } else {
            setProgress([]);
        }
    };

    const handleProgressChange = (taskCode: string, value: string) => {
        const numValue = Math.min(100, Math.max(0, Number(value) || 0));

        setProgress(prev => {
            const existing = prev.find(p => p.taskCode === taskCode);
            if (existing) {
                return prev.map(p => p.taskCode === taskCode ? { ...p, percentageOfWork: numValue } : p);
            } else {
                return [...prev, { taskCode, percentageOfWork: numValue }];
            }
        });
    };

    const handleSave = async () => {
        if (!selectedProject || !selectedBuilding) {
            setSnackbar({ open: true, message: "Please select Project and Building", severity: "error" });
            return;
        }

        try {
            setLoading(true);
            await projectApi.saveBuildingProgress(selectedProject.projectId || selectedProject.id, selectedBuilding, progress);
            setSnackbar({ open: true, message: "Progress saved successfully", severity: "success" });
        } catch (err: any) {
            console.error("Save failed", err);
            setSnackbar({ open: true, message: "Failed to save progress", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const getProgressValue = (code: string) => {
        const item = progress.find(p => p.taskCode === code);
        return item ? item.percentageOfWork : "";
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 1, borderBottom: "2px solid #ccc", pb: 1, color: "#2e7d32" }}>
                Task/Activity
            </Typography>
            <Typography variant="caption" color="error" sx={{ mb: 3, display: 'block' }}>
                All * Mark Field are Mandatory.
            </Typography>
            <Typography variant="h6" color="success.main" sx={{ mb: 2 }}>
                Project
            </Typography>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, alignItems: 'center' }}>
                    {/* Project */}
                    <TextField
                        select
                        fullWidth
                        label="Project Name *"
                        value={selectedProject?.id || ""}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        size="small"
                        disabled={!!id && id !== '%5Bid%5D'}
                    >
                        <MenuItem value="">Select Project</MenuItem>
                        {projects.map((p) => (
                            <MenuItem key={p.id} value={p.id}>{p.projectName}</MenuItem>
                        ))}
                    </TextField>

                    {/* Building */}
                    <TextField
                        select
                        fullWidth
                        label="Building Name *"
                        value={selectedBuilding}
                        onChange={(e) => handleBuildingChange(e.target.value)}
                        size="small"
                        disabled={!selectedProject}
                    >
                        <MenuItem value="">Select Building</MenuItem>
                        {buildings.map((b) => (
                            <MenuItem key={b.id} value={b.id}>{b.buildingName}</MenuItem>
                        ))}
                    </TextField>
                </Box>
            </Paper>

            {selectedProject && selectedBuilding && (
                <TableContainer component={Paper} elevation={1} sx={{ mb: 3 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: "#5d99c6" }}>
                            <TableRow>
                                <TableCell sx={{ color: "white", fontWeight: "bold", width: '10%' }}>SR NO.</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold", width: '60%' }}>Tasks / Activity</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold", width: '30%' }}>Percentage of Work</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {taskMasters.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">No tasks defined</TableCell>
                                </TableRow>
                            ) : (
                                taskMasters.map((task, index) => (
                                    <TableRow key={task.code}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{task.label} *</TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="number"
                                                inputProps={{ min: 0, max: 100 }}
                                                value={getProgressValue(task.code)}
                                                onChange={(e) => handleProgressChange(task.code, e.target.value)}
                                                placeholder="0"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box>
                <Button
                    variant="contained"
                    sx={{ bgcolor: "#2e7d32", '&:hover': { bgcolor: "#1b5e20" } }}
                    onClick={handleSave}
                    disabled={!selectedProject || !selectedBuilding}
                >
                    Save
                </Button>
            </Box>

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
