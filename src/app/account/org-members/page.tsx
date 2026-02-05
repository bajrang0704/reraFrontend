"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { profileApi } from "@/lib/api/profile";
import { OrgMember, Designation, District, Mandal, Village } from "@/types/profile";
import { useAuth } from "@/context/AuthContext";
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
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
    Tooltip,
    Grid
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const AADHAR_REGEX = /^[0-9]{12}$/;

export default function OrgMembersPage() {
    const { user } = useAuth();
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [mandals, setMandals] = useState<Mandal[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);

    const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<OrgMember>();

    useEffect(() => {
        if (user?.projectId) {
            loadMembers();
            loadDistricts();
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

    const loadDistricts = async () => {
        try {
            const data = await profileApi.getDistricts();
            setDistricts(data);
        } catch (error) {
            console.error("Failed to load districts", error);
        }
    };

    const loadDesignations = async (orgType: string) => {
        try {
            const data = await profileApi.getDesignations(orgType);
            setDesignations(data);
        } catch (error) {
            console.error("Failed to load designations", error);
            setDesignations([]);
        }
    };

    const handleDistrictChange = async (districtId: string) => {
        setValue("mandal", "");
        setValue("village", "");
        setVillages([]);
        if (districtId) {
            const data = await profileApi.getMandals(districtId);
            setMandals(data);
        } else {
            setMandals([]);
        }
    };

    const handleMandalChange = async (mandalId: string) => {
        setValue("village", "");
        if (mandalId) {
            const data = await profileApi.getVillages(mandalId);
            setVillages(data);
        } else {
            setVillages([]);
        }
    };

    const handleClose = () => {
        setIsAdding(false);
        setEditingId(null);
        reset();
        setMandals([]);
        setVillages([]);
    };

    const onSubmit = async (data: OrgMember) => {
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

    const handleEdit = async (member: OrgMember) => {
        setEditingId(member.id || null);
        reset(member);
        setIsAdding(true);
        // Load mandals and villages for existing member
        if (member.district) {
            const mandalsData = await profileApi.getMandals(member.district);
            setMandals(mandalsData);
            if (member.mandal) {
                const villagesData = await profileApi.getVillages(member.mandal);
                setVillages(villagesData);
            }
        }
    };

    const handleAdd = () => {
        // For simplicity, load default designations (LLP as example)
        loadDesignations("LLP");
        setIsAdding(true);
    };

    const getDesignationLabel = (code: string) => {
        const d = designations.find(d => d.code === code);
        return d?.label || code;
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
                    onClick={handleAdd}
                >
                    Add Member
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'primary.main' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>First Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Last Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Designation</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>PAN Number</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Aadhaar Number</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 100 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">No members added yet</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => (
                                <TableRow key={member.id} hover>
                                    <TableCell>{member.firstName}</TableCell>
                                    <TableCell>{member.lastName}</TableCell>
                                    <TableCell>{getDesignationLabel(member.designationCode)}</TableCell>
                                    <TableCell>{member.panNumber || '-'}</TableCell>
                                    <TableCell>{member.aadhaarNumber || '-'}</TableCell>
                                    <TableCell>
                                        <Box display="flex">
                                            <Tooltip title="Edit">
                                                <IconButton size="small" color="primary" onClick={() => handleEdit(member)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(member.id!)}>
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

            <Dialog open={isAdding} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{editingId ? "Edit Member" : "Add New Member"}</DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Controller
                                    name="designationCode"
                                    control={control}
                                    rules={{ required: "Required" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            select
                                            label="Designation"
                                            error={!!errors.designationCode}
                                        >
                                            {designations.map((d) => (
                                                <MenuItem key={d.code} value={d.code}>{d.label}</MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    {...register("firstName", { required: "Required" })}
                                    error={!!errors.firstName}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Middle Name"
                                    {...register("middleName")}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    {...register("lastName", { required: "Required" })}
                                    error={!!errors.lastName}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="PAN Number"
                                    {...register("panNumber", {
                                        required: "Required",
                                        pattern: { value: PAN_REGEX, message: "Invalid PAN" }
                                    })}
                                    error={!!errors.panNumber}
                                    helperText={errors.panNumber?.message}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Aadhaar Number"
                                    {...register("aadhaarNumber", {
                                        required: "Required",
                                        pattern: { value: AADHAR_REGEX, message: "Invalid Aadhaar" }
                                    })}
                                    error={!!errors.aadhaarNumber}
                                    helperText={errors.aadhaarNumber?.message}
                                />
                            </Grid>

                            {/* Address Fields */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Address</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField fullWidth label="House Number" {...register("houseNumber")} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Controller
                                    name="district"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            select
                                            label="District"
                                            onChange={(e) => {
                                                field.onChange(e.target.value);
                                                handleDistrictChange(e.target.value);
                                            }}
                                        >
                                            {districts.map((d) => (
                                                <MenuItem key={d.code} value={d.code}>{d.name}</MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Controller
                                    name="mandal"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            select
                                            label="Mandal"
                                            disabled={!watch("district")}
                                            onChange={(e) => {
                                                field.onChange(e.target.value);
                                                handleMandalChange(e.target.value);
                                            }}
                                        >
                                            {mandals.map((m) => (
                                                <MenuItem key={m.code} value={m.code}>{m.name}</MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Controller
                                    name="village"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            select
                                            label="Village"
                                            disabled={!watch("mandal")}
                                        >
                                            {villages.map((v) => (
                                                <MenuItem key={v.code} value={v.code}>{v.name}</MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField fullWidth label="Pin Code" {...register("pinCode")} />
                            </Grid>
                        </Grid>

                        <Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
                            <Button onClick={handleClose}>Cancel</Button>
                            <Button type="submit" variant="contained" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save"}
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}
