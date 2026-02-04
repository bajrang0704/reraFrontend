"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { profileApi } from "@/lib/api/profile";
import { PastExperience } from "@/types/profile";
import { useAuth } from "@/context/AuthContext";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Container,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    CircularProgress,
    Tooltip
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface PastExperienceFormData {
    projectName: string;
    completionYear: number;
    location: string;
    details?: string;
}

export default function PastExperiencePage() {
    const { user } = useAuth();
    const [experiences, setExperiences] = useState<PastExperience[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PastExperienceFormData>();

    useEffect(() => {
        if (user?.projectId) {
            loadExperiences();
        }
    }, [user?.projectId]);

    const loadExperiences = async () => {
        if (!user?.projectId) return;
        try {
            const data = await profileApi.getPastExperiences(user.projectId);
            setExperiences(data);
        } catch (error) {
            console.error("Failed to load past experiences", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsAdding(false);
        setEditingId(null);
        reset();
    };

    const onSubmit = async (data: PastExperienceFormData) => {
        if (!user?.projectId) return;
        try {
            if (editingId) {
                await profileApi.updatePastExperience(user.projectId, editingId, data);
            } else {
                await profileApi.addPastExperience(user.projectId, data);
            }
            handleClose();
            loadExperiences();
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save experience");
        }
    };

    const handleDelete = async (id: string) => {
        if (!user?.projectId) return;
        if (!confirm("Are you sure you want to delete this experience?")) return;
        try {
            await profileApi.deletePastExperience(user.projectId, id);
            loadExperiences();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleEdit = (exp: PastExperience) => {
        setEditingId(exp.id);
        reset(exp);
        setIsAdding(true);
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">Past Experience Details</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsAdding(true)}
                >
                    Add Experience
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'primary.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Project Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Completion Year</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Location</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Details</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 100 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {experiences.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">No past experiences added</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            experiences.map((exp) => (
                                <TableRow key={exp.id} hover>
                                    <TableCell>{exp.projectName}</TableCell>
                                    <TableCell>{exp.completionYear}</TableCell>
                                    <TableCell>{exp.location}</TableCell>
                                    <TableCell>{exp.details || '-'}</TableCell>
                                    <TableCell>
                                        <Box display="flex">
                                            <Tooltip title="Edit">
                                                <IconButton size="small" color="primary" onClick={() => handleEdit(exp)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(exp.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={isAdding} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? "Edit Experience" : "Add New Experience"}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
                        <Box display="flex" flexDirection="column" gap={2}>
                            <TextField
                                fullWidth
                                label="Project Name"
                                {...register("projectName", { required: "Project name is required" })}
                                error={!!errors.projectName}
                                helperText={errors.projectName?.message}
                            />
                            <TextField
                                fullWidth
                                label="Completion Year"
                                type="number"
                                {...register("completionYear", {
                                    required: "Completion year is required",
                                    valueAsNumber: true,
                                    min: { value: 1900, message: "Year must be after 1900" },
                                    max: { value: new Date().getFullYear(), message: "Year cannot be in future" }
                                })}
                                error={!!errors.completionYear}
                                helperText={errors.completionYear?.message}
                            />
                            <TextField
                                fullWidth
                                label="Location"
                                {...register("location", { required: "Location is required" })}
                                error={!!errors.location}
                                helperText={errors.location?.message}
                            />
                            <TextField
                                fullWidth
                                label="Details"
                                multiline
                                rows={3}
                                {...register("details")}
                            />
                            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                                <Button onClick={handleClose}>Cancel</Button>
                                <Button type="submit" variant="contained" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save"}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
