"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
    IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { projectApi } from "@/lib/api/project";
import { profileApi } from "@/lib/api/profile";
import { useAuth } from "@/context/AuthContext";
import { Project, DocumentType, ProjectDocument } from "@/types/project";

export default function ProjectDocumentsPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploading, setUploading] = useState<string | null>(null); // documentTypeCode or docId being uploaded
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Helper to control file inputs
    const [fileInputs, setFileInputs] = useState<{ [key: string]: File | null }>({});
    // Helper to control custom document names
    const [customNames, setCustomNames] = useState<{ [key: string]: string }>({});
    // Helper to control extra "blank" rows for types that allow multiple (like OTHER)
    const [extraRows, setExtraRows] = useState<{ [typeCode: string]: number[] }>({}); // typeCode -> [tempId1, tempId2]

    // Load Initial Data
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

                // 2. Fetch Document Types
                console.log("DEBUG: Fetching Document Types...");
                const types = await projectApi.getDocumentTypes();
                console.log("DEBUG: Document Types Fetched:", types);

                // Sort by displayOrder
                types.sort((a, b) => a.displayOrder - b.displayOrder);
                setDocumentTypes(types);

            } catch (err: any) {
                console.error("Failed to load initial data", err);
                setSnackbar({ open: true, message: "Failed to load types: " + (err.response?.data?.message || err.message), severity: "error" });
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [user?.loginId]);

    // Handle Project Change
    const handleProjectChange = async (projectUuid: string) => {
        if (!projectUuid) {
            setSelectedProject(null);
            setProjectDocuments([]);
            return;
        }
        try {
            setLoading(true);
            const project = projects.find(p => p.id === projectUuid);
            setSelectedProject(project || null);

            const apiProjectId = project?.projectId || project?.id || projectUuid;
            await refreshDocuments(apiProjectId);

        } catch (err) {
            console.error("Failed to load details", err);
            setSnackbar({ open: true, message: "Failed to load details", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const refreshDocuments = async (projectId: string) => {
        const docs = await projectApi.getProjectDocuments(projectId);
        setProjectDocuments(docs);
    };

    const handleFileSelect = (code: string, file: File | null) => {
        setFileInputs(prev => ({ ...prev, [code]: file }));
    };

    const handleUpload = async (docType: DocumentType, existingDoc?: ProjectDocument, tempId?: number) => {
        const fileKey = tempId ? `${docType.code}-${tempId}` : docType.code;
        const file = fileInputs[fileKey];

        if (!file && !existingDoc) {
            setSnackbar({ open: true, message: "Please select a file first", severity: "error" });
            return;
        }
        if (!selectedProject) return;

        // Custom Name Validation
        let customNameValue = undefined;
        if (docType.allowsCustomName) {
            const nameKey = tempId ? `${docType.code}-${tempId}` : docType.code;
            customNameValue = docType.allowsCustomName ? (existingDoc?.customDocumentName || customNames[nameKey]) : undefined;
            if (docType.allowsCustomName && !customNameValue) {
                setSnackbar({ open: true, message: "Please enter a document name", severity: "error" });
                return;
            }
        }

        // If file selected, proceed to upload
        if (file) {
            try {
                setUploading(fileKey);
                const apiProjectId = selectedProject.projectId || selectedProject.id;

                let docId = existingDoc?.id;

                // 1. Create Row if doesn't exist
                if (!docId) {
                    const res = await projectApi.addDocumentRow(apiProjectId, {
                        documentTypeCode: docType.code,
                        customDocumentName: customNameValue,
                    });
                    docId = res.data.documentId;
                }

                // 2. Upload File
                await projectApi.uploadDocumentFile(apiProjectId, docId, file);

                setSnackbar({ open: true, message: "File uploaded successfully", severity: "success" });

                // Cleanup inputs
                setFileInputs(prev => {
                    const next = { ...prev };
                    delete next[fileKey];
                    return next;
                });
                if (tempId) {
                    // Remove the temp row since it will be replaced by the real doc from refresh
                    setExtraRows(prev => ({
                        ...prev,
                        [docType.code]: prev[docType.code]?.filter(id => id !== tempId) || []
                    }));
                }

                await refreshDocuments(apiProjectId);

            } catch (err: any) {
                console.error("Upload failed", err);
                setSnackbar({ open: true, message: "Upload failed: " + (err.response?.data?.error || err.message), severity: "error" });
            } finally {
                setUploading(null);
            }
        }
    };

    const handleAddRow = (typeCode: string) => {
        setExtraRows(prev => ({
            ...prev,
            [typeCode]: [...(prev[typeCode] || []), Date.now()]
        }));
    };

    const handleRemoveTempRow = (typeCode: string, tempId: number) => {
        setExtraRows(prev => ({
            ...prev,
            [typeCode]: prev[typeCode]?.filter(id => id !== tempId) || []
        }));
    };

    const handleDelete = async (docId: string) => {
        if (!selectedProject || !confirm("Are you sure you want to delete this document?")) return;
        try {
            setLoading(true);
            const apiProjectId = selectedProject.projectId || selectedProject.id;
            await projectApi.deleteDocument(apiProjectId, docId);
            setSnackbar({ open: true, message: "Document deleted", severity: "success" });
            await refreshDocuments(apiProjectId);
        } catch (err: any) {
            console.error("Delete failed", err);
            setSnackbar({ open: true, message: "Delete failed: " + (err.response?.data?.error || err.message), severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 1, borderBottom: "2px solid #ccc", pb: 1, color: "#0d47a1" }}>
                Document Upload
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
                    InputLabelProps={{ shrink: true }}
                >
                    <MenuItem value="">Select Project</MenuItem>
                    {projects.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.projectName}</MenuItem>
                    ))}
                </TextField>
            </Paper>

            {selectedProject && (
                <TableContainer component={Paper} elevation={2}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: "#5d99c6" }}>
                            <TableRow>
                                <TableCell sx={{ color: "white", fontWeight: "bold", width: "5%" }}>Sr. No</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold", width: "40%" }}>Document Name</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold", width: "35%" }}>Uploaded Document</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold", width: "20%" }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {documentTypes.map((type, index) => {
                                // Find existing docs for this type
                                const docs = projectDocuments.filter(d => d.documentTypeCode === type.code);

                                // Extra (Pending) Rows
                                const tempIds = extraRows[type.code] || [];

                                // Base Render List: Existing Docs + Pending Rows + (Optional: One blank if no docs and no pending and not allowsMultiple? No, standard logic)
                                // Standard logic:
                                // If allowsCustomName: Show all docs. Show "Add" button always? 
                                // If !allowsCustomName: Show 1 row (doc if exists, else blank). No Add button.

                                const isCustom = type.allowsCustomName;
                                const showAddButton = true;

                                // Construct the list items to render. 
                                // We iterate over existing docs 
                                // THEN iterate over tempIds.
                                // If docs=0 and no tempIds, we start with 1 blank row (tempId = -1).

                                let itemsToRender: Array<{ doc?: ProjectDocument, tempId?: number }> = docs.map(d => ({ doc: d }));


                                tempIds.forEach(id => itemsToRender.push({ tempId: id }));

                                // If no *saved* documents exist, ensure we show the default blank row (tempId: -1)
                                // This ensures that adding *extra* rows doesn't replace the initial field.
                                if (docs.length === 0) {
                                    itemsToRender.unshift({ tempId: -1 });
                                }

                                return itemsToRender.map((item, itemIndex) => {
                                    const { doc, tempId } = item;
                                    const uniqueKey = doc ? doc.id : `temp-${type.code}-${tempId || itemIndex}`;
                                    const inputKey = tempId ? `${type.code}-${tempId}` : type.code;

                                    const selectedFile = fileInputs[inputKey];

                                    return (
                                        <TableRow key={uniqueKey} hover>
                                            <TableCell>{itemIndex === 0 ? index + 1 : ""}</TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2">
                                                        {type.label} {type.mandatoryForOngoingOnly ? "*" : ""}
                                                    </Typography>
                                                    {/* If Custom Name Allowed, Show Input or Display Name */}
                                                    {isCustom && (
                                                        <Box sx={{ mt: 1 }}>
                                                            {doc ? (
                                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                    {doc.customDocumentName}
                                                                </Typography>
                                                            ) : (
                                                                <TextField
                                                                    placeholder="Enter Document Name"
                                                                    size="small"
                                                                    fullWidth
                                                                    value={customNames[inputKey] || ""}
                                                                    onChange={(e) => setCustomNames(prev => ({ ...prev, [inputKey]: e.target.value }))}
                                                                />
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {doc?.fileName ? (
                                                    <Typography variant="body2" color="primary">
                                                        <a href="#" style={{ textDecoration: 'none' }}>{doc.fileName}</a>
                                                    </Typography>
                                                ) : (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Button
                                                            variant="outlined"
                                                            component="label"
                                                            size="small"
                                                            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                                                        >
                                                            Choose File
                                                            <input
                                                                type="file"
                                                                hidden
                                                                accept="application/pdf,image/*"
                                                                onChange={(e) => handleFileSelect(inputKey, e.target.files?.[0] || null)}
                                                            />
                                                        </Button>
                                                        <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: 200 }}>
                                                            {selectedFile ? selectedFile.name : "No file chosen"}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {!doc?.fileName && (
                                                        <Button
                                                            variant="contained"
                                                            color="warning"
                                                            size="small"
                                                            startIcon={<CloudUploadIcon />}
                                                            onClick={() => handleUpload(type, doc, tempId)}
                                                            disabled={uploading === inputKey}
                                                            sx={{ color: '#fff' }}
                                                        >
                                                            {uploading === inputKey ? "..." : "Upload"}
                                                        </Button>
                                                    )}

                                                    {/* Delete or Remove Temp */}
                                                    {doc?.fileName ? (
                                                        <IconButton
                                                            color="error"
                                                            size="small"
                                                            onClick={() => handleDelete(doc.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    ) : (
                                                        // If it's a temp row (and not the only one for fixed types), allow remove?
                                                        // For "Other", if it's a temp row, allow remove.
                                                        (tempId && tempId !== -1) ? (
                                                            <IconButton
                                                                color="error"
                                                                size="small"
                                                                onClick={() => handleRemoveTempRow(type.code, tempId)}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        ) : null
                                                    )}

                                                    {/* Add Button for Custom Types */}
                                                    {showAddButton && itemIndex === itemsToRender.length - 1 && (
                                                        <Button
                                                            variant="contained"
                                                            color="success"
                                                            size="small"
                                                            onClick={() => handleAddRow(type.code)}
                                                            sx={{ minWidth: 'auto', px: 2 }}
                                                        >
                                                            + Add
                                                        </Button>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                });
                            })}
                            {documentTypes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                        {loading ? <CircularProgress size={24} /> : "No Document Types Found"}
                                    </TableCell>
                                </TableRow>
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
