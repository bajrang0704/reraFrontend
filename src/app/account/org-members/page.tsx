"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { profileApi } from "@/lib/api/profile";
import { OrgMember } from "@/types/profile";
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

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const AADHAR_REGEX = /^[0-9]{12}$/;

interface OrgMemberFormData {
    name: string;
    designation: string;
    panNumber?: string;
    aadharNumber?: string;
}

export default function OrgMembersPage() {
    const { user } = useAuth();
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<OrgMemberFormData>();

    useEffect(() => {
        if (user?.projectId) {
            loadMembers();
        }
    }, [user?.projectId]);

    const loadMembers = async () => {
        if (!user?.projectId) return;
        try {
            const data = await profileApi.getOrgMembers(user.projectId);
            setMembers(data);
        } catch (error) {
            console.error("Failed to load org members", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsAdding(false);
        setEditingId(null);
        reset();
    };

    const onSubmit = async (data: OrgMemberFormData) => {
        if (!user?.projectId) return;
        try {
            if (editingId) {
                await profileApi.updateOrgMember(user.projectId, editingId, data);
            } else {
                await profileApi.addOrgMember(user.projectId, data);
            }
            handleClose();
            loadMembers();
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save member");
        }
    };

    const handleDelete = async (id: string) => {
        if (!user?.projectId) return;
        if (!confirm("Are you sure you want to delete this member?")) return;
        try {
            await profileApi.deleteOrgMember(user.projectId, id);
            loadMembers();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleEdit = (member: OrgMember) => {
        setEditingId(member.id);
        reset(member);
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
                <Typography variant="h5" fontWeight="bold">Organization Other Member Details</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsAdding(true)}
                >
                    Add Member
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'primary.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Designation</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>PAN Number</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Aadhar Number</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 100 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">No members added yet</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => (
                                <TableRow key={member.id} hover>
                                    <TableCell>{member.name}</TableCell>
                                    <TableCell>{member.designation}</TableCell>
                                    <TableCell>{member.panNumber || '-'}</TableCell>
                                    <TableCell>{member.aadharNumber || '-'}</TableCell>
                                    <TableCell>
                                        <Box display="flex">
                                            <Tooltip title="Edit">
                                                <IconButton size="small" color="primary" onClick={() => handleEdit(member)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(member.id)}>
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
                <DialogTitle>{editingId ? "Edit Member" : "Add New Member"}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
                        <Box display="flex" flexDirection="column" gap={2}>
                            <TextField
                                fullWidth
                                label="Name"
                                {...register("name", { required: "Name is required" })}
                                error={!!errors.name}
                                helperText={errors.name?.message}
                            />
                            <TextField
                                fullWidth
                                label="Designation"
                                {...register("designation", { required: "Designation is required" })}
                                error={!!errors.designation}
                                helperText={errors.designation?.message}
                            />
                            <TextField
                                fullWidth
                                label="PAN Number"
                                placeholder="ABCDE1234F"
                                {...register("panNumber", {
                                    pattern: { value: PAN_REGEX, message: "Invalid PAN format" }
                                })}
                                error={!!errors.panNumber}
                                helperText={errors.panNumber?.message}
                            />
                            <TextField
                                fullWidth
                                label="Aadhar Number"
                                placeholder="123456789012"
                                {...register("aadharNumber", {
                                    pattern: { value: AADHAR_REGEX, message: "Aadhar must be 12 digits" }
                                })}
                                error={!!errors.aadharNumber}
                                helperText={errors.aadharNumber?.message}
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
