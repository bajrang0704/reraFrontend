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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    CircularProgress,
    Snackbar,
    Alert,
    MenuItem
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { projectApi } from "@/lib/api/project";
import { Project, ProjectProfessional, ProfessionalType } from "@/types/project";
import { useAuth } from "@/context/AuthContext";
import { profileApi } from "@/lib/api/profile";

export default function ProfessionalDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();

    // State
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [professionals, setProfessionals] = useState<ProjectProfessional[]>([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Form State for "New" rows (one per type)
    const [newRows, setNewRows] = useState<{ [key in ProfessionalType]?: Partial<ProjectProfessional> }>({});

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<ProjectProfessional>>({});

    const handleEditClick = (professional: ProjectProfessional) => {
        setEditingId(professional.id);
        setEditFormData({ ...professional });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleEditFormChange = (field: keyof ProjectProfessional, value: string) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleUpdateSave = async () => {
        if (!selectedProject || !editingId) return;

        // Basic Validation (Copy of Add validation)
        if (!editFormData.name || !editFormData.address || !editFormData.contactNo) {
            setSnackbar({ open: true, message: "Please fill Name, Address and Contact No", severity: "error" });
            return;
        }

        const type = editFormData.professionalType;
        if (type === ProfessionalType.ARCHITECT && !editFormData.coaCertificateNo) {
            setSnackbar({ open: true, message: "CoA Certificate Number is required for Architects", severity: "error" });
            return;
        }

        try {
            setLoading(true);
            const apiProjectId = selectedProject.projectId || selectedProject.id;
            // API call to update
            await projectApi.updateProjectProfessional(apiProjectId, editingId, editFormData);

            setSnackbar({ open: true, message: "Updated successfully", severity: "success" });
            setEditingId(null);
            setEditFormData({});
            await fetchProfessionals(apiProjectId);
        } catch (err: any) {
            console.error("Update failed", err);
            setSnackbar({ open: true, message: "Update failed: " + (err.response?.data?.error || err.message), severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    // Fetch initial data (Projects)
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

                    // Auto-select if ID matches
                    const decodedId = decodeURIComponent(id);
                    const current = projectList.find(p => p.id === decodedId || p.projectId === decodedId);
                    if (current) {
                        setSelectedProject(current);
                        fetchProfessionals(current.projectId || current.id);
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

    const fetchProfessionals = async (projectId: string) => {
        try {
            console.log("Fetching professionals for:", projectId);
            const data = await projectApi.getProjectProfessionals(projectId);
            console.log("Fetched professionals:", data);
            setProfessionals(data);
        } catch (err) {
            console.error("Failed to load professionals", err);
        }
    };

    const handleProjectChange = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        setSelectedProject(project || null);
        if (project) {
            fetchProfessionals(project.projectId || project.id);
        } else {
            setProfessionals([]);
        }
    };

    const handleInputChange = (type: ProfessionalType, field: keyof ProjectProfessional, value: string) => {
        setNewRows(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value,
                professionalType: type // Ensure type is set
            }
        }));
    };

    const handleAdd = async (type: ProfessionalType) => {
        if (!selectedProject) return;
        const data = newRows[type];

        // Basic Validation
        if (!data?.name || !data?.address || !data?.contactNo) {
            setSnackbar({ open: true, message: "Please fill Name, Address and Contact No", severity: "error" });
            return;
        }

        // Type Specific Validation
        if (type === ProfessionalType.ARCHITECT && !data.coaCertificateNo) {
            setSnackbar({ open: true, message: "CoA Certificate Number is required for Architects", severity: "error" });
            return;
        }

        // Agent validation? Mockup shows RERA No.
        if (type === ProfessionalType.REAL_ESTATE_AGENT && !data.reraCertificateNo) {
            // Optional? User said "Validates rules based on type". Let's assume required if field is shown.
            // But let's be lenient unless backend strict. Backend says: "CoA Required for Architect".
        }

        try {
            setLoading(true);
            const apiProjectId = selectedProject.projectId || selectedProject.id;
            console.log("Adding Professional:", { apiProjectId, data });

            const response = await projectApi.addProjectProfessional(apiProjectId, data);
            console.log("Add Success, Response:", response);

            setSnackbar({ open: true, message: "Professional added successfully", severity: "success" });

            // Clear input
            setNewRows(prev => {
                const copy = { ...prev };
                delete copy[type];
                return copy;
            });

            // Refresh
            console.log("Refetching professionals...");
            await fetchProfessionals(apiProjectId);

        } catch (err: any) {
            console.error("Add failed", err);
            setSnackbar({ open: true, message: "Failed to add: " + (err.response?.data?.error || err.message), severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (profId: string) => {
        if (!selectedProject || !confirm("Are you sure?")) return;
        try {
            setLoading(true);
            const apiProjectId = selectedProject.projectId || selectedProject.id;
            await projectApi.deleteProjectProfessional(apiProjectId, profId);
            setSnackbar({ open: true, message: "Deleted successfully", severity: "success" });
            await fetchProfessionals(apiProjectId);
        } catch (err: any) {
            console.error("Delete failed", err);
            setSnackbar({ open: true, message: "Delete failed", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const renderTable = (type: ProfessionalType) => {
        const typeProfs = (professionals || []).filter(p => p.professionalType === type);
        const newRow = newRows[type] || {};

        const isAgent = type === ProfessionalType.REAL_ESTATE_AGENT;
        const isArchitect = type === ProfessionalType.ARCHITECT;

        return (
            <TableContainer component={Paper} elevation={1} sx={{ mt: 2 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: "#5d99c6" }}>
                        <TableRow>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Sr. No</TableCell>
                            {isAgent && <TableCell sx={{ color: "white", fontWeight: "bold" }}>RERA Certificate No.</TableCell>}
                            {isArchitect && <TableCell sx={{ color: "white", fontWeight: "bold" }}>CoA Certificate No.</TableCell>}
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Address</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Aadhaar No.</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Contact No.</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* Input Row */}
                        <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                            <TableCell></TableCell>
                            {isAgent && (
                                <TableCell>
                                    <TextField
                                        size="small" placeholder="RERA No"
                                        value={newRow.reraCertificateNo || ""}
                                        onChange={e => handleInputChange(type, 'reraCertificateNo', e.target.value)}
                                    />
                                </TableCell>
                            )}
                            {isArchitect && (
                                <TableCell>
                                    <TextField
                                        size="small" placeholder="CoA No *"
                                        value={newRow.coaCertificateNo || ""}
                                        onChange={e => handleInputChange(type, 'coaCertificateNo', e.target.value)}
                                    />
                                </TableCell>
                            )}
                            <TableCell>
                                <TextField
                                    size="small" placeholder="Name *"
                                    value={newRow.name || ""}
                                    onChange={e => handleInputChange(type, 'name', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    size="small" placeholder="Address *"
                                    value={newRow.address || ""}
                                    onChange={e => handleInputChange(type, 'address', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    size="small" placeholder="Aadhaar"
                                    value={newRow.aadhaarNo || ""}
                                    onChange={e => handleInputChange(type, 'aadhaarNo', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <TextField
                                    size="small" placeholder="Contact *"
                                    value={newRow.contactNo || ""}
                                    onChange={e => handleInputChange(type, 'contactNo', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <IconButton
                                    size="small"
                                    sx={{ bgcolor: "#2e7d32", color: "white", '&:hover': { bgcolor: "#1b5e20" } }}
                                    onClick={() => handleAdd(type)}
                                >
                                    <AddIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>

                        {/* Existing Rows */}
                        {typeProfs.map((p, idx) => {
                            const isEditing = editingId === p.id;
                            const currentData = isEditing ? editFormData : p;

                            return (
                                <TableRow key={p.id} sx={isEditing ? { bgcolor: "#fff3e0" } : {}}>
                                    <TableCell>{idx + 1}</TableCell>

                                    {isAgent && (
                                        <TableCell>
                                            {isEditing ? (
                                                <TextField
                                                    size="small"
                                                    value={currentData.reraCertificateNo || ""}
                                                    onChange={e => handleEditFormChange('reraCertificateNo', e.target.value)}
                                                />
                                            ) : (
                                                p.reraCertificateNo || "-"
                                            )}
                                        </TableCell>
                                    )}

                                    {isArchitect && (
                                        <TableCell>
                                            {isEditing ? (
                                                <TextField
                                                    size="small"
                                                    value={currentData.coaCertificateNo || ""}
                                                    onChange={e => handleEditFormChange('coaCertificateNo', e.target.value)}
                                                />
                                            ) : (
                                                p.coaCertificateNo || "-"
                                            )}
                                        </TableCell>
                                    )}

                                    <TableCell>
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={currentData.name || ""}
                                                onChange={e => handleEditFormChange('name', e.target.value)}
                                            />
                                        ) : p.name}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={currentData.address || ""}
                                                onChange={e => handleEditFormChange('address', e.target.value)}
                                            />
                                        ) : p.address}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={currentData.aadhaarNo || ""}
                                                onChange={e => handleEditFormChange('aadhaarNo', e.target.value)}
                                            />
                                        ) : (p.aadhaarNo || "-")}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <TextField
                                                size="small"
                                                value={currentData.contactNo || ""}
                                                onChange={e => handleEditFormChange('contactNo', e.target.value)}
                                            />
                                        ) : p.contactNo}
                                    </TableCell>

                                    <TableCell>
                                        {isEditing ? (
                                            <>
                                                <IconButton size="small" color="success" onClick={handleUpdateSave}>
                                                    <CheckIcon />
                                                </IconButton>
                                                <IconButton size="small" color="warning" onClick={handleCancelEdit}>
                                                    <CloseIcon />
                                                </IconButton>
                                            </>
                                        ) : (
                                            <>
                                                <IconButton size="small" color="primary" onClick={() => handleEditClick(p)}>
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 1, borderBottom: "2px solid #ccc", pb: 1, color: "#0d47a1" }}>
                Project Professional
            </Typography>
            <Typography variant="caption" color="error" sx={{ mb: 3, display: 'block' }}>
                All * Mark field are mandatory.
            </Typography>

            {/* Project Selection */}
            <Paper sx={{ p: 3, mb: 4 }}>
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
            </Paper>

            {selectedProject && (
                <Box>
                    {Object.values(ProfessionalType).map((type) => (
                        <Accordion key={type} defaultExpanded={type === ProfessionalType.REAL_ESTATE_AGENT}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight="bold">
                                    + {type.replace(/_/g, " ")} {type === ProfessionalType.ARCHITECT || type === ProfessionalType.STRUCTURAL_ENGINEER ? "*" : ""}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {renderTable(type)}
                            </AccordionDetails>
                        </Accordion>
                    ))}
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
