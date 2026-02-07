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
    IconButton,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormControl,
    FormLabel
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { projectApi } from "@/lib/api/project";
import { Project, ProjectLitigation, CaseType, PetitionType } from "@/types/project";
import { useAuth } from "@/context/AuthContext";
import { profileApi } from "@/lib/api/profile";

export default function ProjectLitigationsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();

    // State
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [litigations, setLitigations] = useState<ProjectLitigation[]>([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Form State
    const [formData, setFormData] = useState<Partial<ProjectLitigation>>({
        caseYear: new Date().getFullYear(),
        hasInterimOrder: false,
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    // Fetch Projects
    useEffect(() => {
        const loadProjects = async () => {
            if (!user?.loginId) return;
            try {
                setLoading(true);
                const profileRes = await profileApi.getProfile(user.loginId);
                const profileId = (profileRes as any).data?.id || (profileRes as any).profile?.id;
                if (profileId) {
                    const projectList = await projectApi.listProjects(profileId);
                    setProjects(projectList);

                    const decodedId = decodeURIComponent(id);
                    const current = projectList.find(p => p.id === decodedId || p.projectId === decodedId);
                    if (current) {
                        setSelectedProject(current);
                        fetchLitigations(current.projectId || current.id);
                    }
                }
            } catch (err) {
                console.error("Failed to load projects", err);
            } finally {
                setLoading(false);
            }
        };
        loadProjects();
    }, [user?.loginId, id]);

    const fetchLitigations = async (projectId: string) => {
        try {
            const data = await projectApi.getProjectLitigations(projectId);
            setLitigations(data);
        } catch (err) {
            console.error("Failed to fetch litigations", err);
        }
    };

    const handleProjectChange = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        setSelectedProject(project || null);
        if (project) {
            fetchLitigations(project.projectId || project.id);
        } else {
            setLitigations([]);
        }
    };

    const handleFormChange = (field: keyof ProjectLitigation, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!selectedProject) {
            setSnackbar({ open: true, message: "Please select a project", severity: "error" });
            return;
        }
        if (!formData.courtName || !formData.caseType || !formData.petitionType || !formData.caseNumber || !formData.caseYear || !formData.presentStatus) {
            setSnackbar({ open: true, message: "Please fill all mandatory fields", severity: "error" });
            return;
        }

        try {
            setLoading(true);
            const apiProjectId = selectedProject.projectId || selectedProject.id;

            if (editingId) {
                await projectApi.updateProjectLitigation(apiProjectId, editingId, formData);
                setSnackbar({ open: true, message: "Updated successfully", severity: "success" });
            } else {
                await projectApi.addProjectLitigation(apiProjectId, formData);
                setSnackbar({ open: true, message: "Added successfully", severity: "success" });
            }

            // Reset Form
            setFormData({
                caseYear: new Date().getFullYear(),
                hasInterimOrder: false,
                courtName: '',
                caseNumber: '',
                presentStatus: '',
                caseType: undefined as any,
                petitionType: undefined as any
            });
            setEditingId(null);

            await fetchLitigations(apiProjectId);
        } catch (err: any) {
            console.error("Save failed", err);
            setSnackbar({ open: true, message: "Operation failed: " + (err.response?.data?.error || err.message), severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: ProjectLitigation) => {
        setEditingId(item.id);
        setFormData({ ...item });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (litigationId: string) => {
        if (!selectedProject || !confirm("Are you sure?")) return;
        try {
            setLoading(true);
            const apiProjectId = selectedProject.projectId || selectedProject.id;
            await projectApi.deleteProjectLitigation(apiProjectId, litigationId);
            setSnackbar({ open: true, message: "Deleted successfully", severity: "success" });
            await fetchLitigations(apiProjectId);
        } catch (err) {
            console.error("Delete failed", err);
            setSnackbar({ open: true, message: "Delete failed", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const caseTypes: CaseType[] = ['CIVIL', 'CRIMINAL', 'OTHERS'];
    const petitionTypes: PetitionType[] = ['WRIT_PETITION', 'SUIT', 'OTHER'];
    const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i + 5); // Future 5 years to Past 25

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 1, borderBottom: "2px solid #ccc", pb: 1, color: "#2e7d32" }}>
                Litigations Related to the Project
            </Typography>
            <Typography variant="caption" color="error" sx={{ mb: 3, display: 'block' }}>
                All * Mark field are mandatory.
            </Typography>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>

                    {/* Project */}
                    <TextField
                        select
                        fullWidth
                        label="Project Name *"
                        value={selectedProject?.id || ""}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        size="small"
                    >
                        <MenuItem value="">Select Project</MenuItem>
                        {projects.map((p) => (
                            <MenuItem key={p.id} value={p.id}>{p.projectName}</MenuItem>
                        ))}
                    </TextField>

                    {/* Court Name */}
                    <TextField
                        fullWidth
                        label="Name of the Court *"
                        value={formData.courtName || ""}
                        onChange={(e) => handleFormChange('courtName', e.target.value)}
                        size="small"
                    />

                    {/* Case Type */}
                    <TextField
                        select
                        fullWidth
                        label="Type Of Case *"
                        value={formData.caseType || ""}
                        onChange={(e) => handleFormChange('caseType', e.target.value)}
                        size="small"
                    >
                        <MenuItem value="">Select Case Type</MenuItem>
                        {caseTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>

                    {/* Petition Type */}
                    <TextField
                        select
                        fullWidth
                        label="Petition *"
                        value={formData.petitionType || ""}
                        onChange={(e) => handleFormChange('petitionType', e.target.value)}
                        size="small"
                    >
                        <MenuItem value="">Select Petition</MenuItem>
                        {petitionTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>

                    {/* Case Number */}
                    <TextField
                        fullWidth
                        label="Case Number *"
                        value={formData.caseNumber || ""}
                        onChange={(e) => handleFormChange('caseNumber', e.target.value)}
                        size="small"
                    />

                    {/* Year */}
                    <TextField
                        select
                        fullWidth
                        label="Year *"
                        value={formData.caseYear || ""}
                        onChange={(e) => handleFormChange('caseYear', e.target.value)}
                        size="small"
                    >
                        <MenuItem value="">Select Year</MenuItem>
                        {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                    </TextField>

                    {/* Interim Order Radio */}
                    <FormControl component="fieldset" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 'bold', mr: 2 }}>
                            Whether any Preventive/Injunction Interim Order is Passed *
                        </FormLabel>
                        <RadioGroup
                            row
                            value={formData.hasInterimOrder?.toString()}
                            onChange={(e) => handleFormChange('hasInterimOrder', e.target.value === 'true')}
                        >
                            <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                            <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                        </RadioGroup>
                    </FormControl>

                    {/* Present Status */}
                    <TextField
                        fullWidth
                        label="Present Status *"
                        value={formData.presentStatus || ""}
                        onChange={(e) => handleFormChange('presentStatus', e.target.value)}
                        size="small"
                    />

                </Box>

                <Box sx={{ mt: 3 }}>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: "#2e7d32", '&:hover': { bgcolor: "#1b5e20" } }}
                        onClick={handleSave}
                        disabled={!selectedProject}
                    >
                        {editingId ? "Update" : "Add"}
                    </Button>
                    {editingId && (
                        <Button
                            variant="outlined"
                            color="inherit"
                            sx={{ ml: 2 }}
                            onClick={() => {
                                setEditingId(null);
                                setFormData({
                                    caseYear: new Date().getFullYear(),
                                    hasInterimOrder: false,
                                    courtName: '',
                                    caseNumber: '',
                                    presentStatus: '',
                                    caseType: undefined as any,
                                    petitionType: undefined as any
                                });
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Table */}
            {selectedProject && (
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: "#5d99c6" }}>
                            <TableRow>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Sr No.</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Project Name</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name of the Court</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Case Type</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Petition Type</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Case Number</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Year</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Whether any Preventive/Injunction Interim Order is Passed</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Present Status</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {litigations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center">No data found</TableCell>
                                </TableRow>
                            ) : (
                                litigations.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{selectedProject.projectName}</TableCell>
                                        <TableCell>{item.courtName}</TableCell>
                                        <TableCell>{item.caseType}</TableCell>
                                        <TableCell>{item.petitionType}</TableCell>
                                        <TableCell>{item.caseNumber}</TableCell>
                                        <TableCell>{item.caseYear}</TableCell>
                                        <TableCell>{item.hasInterimOrder ? "Yes" : "No"}</TableCell>
                                        <TableCell>{item.presentStatus}</TableCell>
                                        <TableCell>
                                            <IconButton size="small" color="primary" onClick={() => handleEdit(item)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
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
