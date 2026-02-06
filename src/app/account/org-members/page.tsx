"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { profileApi } from "@/lib/api/profile";
import { OrgMember, Designation, District, Mandal, Village, OtherMember, OrganizationProfile } from "@/types/profile";
import { useAuth } from "@/context/AuthContext";
import OtherMemberForm from "./OtherMemberForm";
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const AADHAR_REGEX = /^[0-9]{12}$/;

export default function OrgMembersPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Standard Organization Members
    const [members, setMembers] = useState<OrgMember[]>([]);

    // Other Members
    const [otherMembers, setOtherMembers] = useState<OtherMember[]>([]);
    const [isOtherOrg, setIsOtherOrg] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [mandals, setMandals] = useState<Mandal[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);

    // For passing data to OtherMemberForm
    const [editingOtherMember, setEditingOtherMember] = useState<OtherMember | null>(null);

    const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<OrgMember>();

    useEffect(() => {
        if (user?.projectId) {
            checkOrgTypeAndLoad();
            loadDistricts();
        }
    }, [user?.projectId]);

    const checkOrgTypeAndLoad = async () => {
        if (!user?.projectId) return;
        try {
            const profileData = await profileApi.getProfile(user.loginId);
            // Handle different response structures
            const p = (profileData as any).data || profileData.profile;
            console.log("OrgMembers page profile data:", p);

            if (p) {
                // Check for new structure (profileType + entityType) or old structure
                const profileType = p.profileType || p.informationType || p.infoType;
                const entityType = p.entityType || p.organizationType || p.orgType;
                const orgDetails = p.organizationDetails;
                const nestedEntityType = orgDetails?.entityType || orgDetails?.organizationType;

                const isOtherThanIndividual = profileType === "OTHER_THAN_INDIVIDUAL" || profileType === "ORGANIZATION";
                const isOthersType = entityType === "OTHERS" || nestedEntityType === "OTHERS";

                console.log("OrgMembers page check:", { profileType, entityType, nestedEntityType, isOtherThanIndividual, isOthersType });

                if (isOtherThanIndividual && isOthersType) {
                    setIsOtherOrg(true);
                    loadOtherMembers();
                } else {
                    setIsOtherOrg(false);
                    loadMembers();
                }
            } else {
                setIsOtherOrg(false);
                loadMembers();
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async () => {
        if (!user?.projectId) return;
        try {
            const data = await profileApi.getOrgMembers(user.loginId);
            setMembers(data);
        } catch (error) {
            console.error("Failed to load org members", error);
        }
    };

    const loadOtherMembers = async () => {
        if (!user?.projectId) return;
        try {
            const data = await profileApi.getOtherMembers(user.loginId);
            setOtherMembers(data);
        } catch (error) {
            console.error("Failed to load other members", error);
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
        setEditingOtherMember(null);
        reset();
        setMandals([]);
        setVillages([]);
    };

    // Standard Member Submit
    const onSubmit = async (data: OrgMember) => {
        if (!user?.projectId) return;
        try {
            if (editingId) {
                await profileApi.updateOrgMember(user.loginId, editingId, data);
            } else {
                await profileApi.addOrgMember(user.loginId, data);
            }
            handleClose();
            loadMembers();
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save member");
        }
    };

    // Other Member Submit
    const onSaveOther = async (data: OtherMember) => {
        if (!user?.projectId) return;
        try {
            if (editingId) {
                await profileApi.updateOtherMember(editingId, data);
            } else {
                await profileApi.addOtherMember(user.loginId, data);
            }
            handleClose(); // Resets editing state
            loadOtherMembers(); // Refreshes list
        } catch (error) {
            console.error("Failed to save other member", error);
            alert("Failed to save member");
        }
    };

    const handleDelete = async (id: string) => {
        if (!user?.projectId) return;
        if (!confirm("Are you sure you want to delete this member?")) return;
        try {
            if (isOtherOrg) {
                await profileApi.deleteOtherMember(id);
                loadOtherMembers();
            } else {
                await profileApi.deleteOrgMember(user.loginId, id);
                loadMembers();
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleEdit = async (member: any) => { // Type loose here to handle both
        setEditingId(member.id || null);
        setIsAdding(true);

        if (isOtherOrg) {
            setEditingOtherMember(member as OtherMember);
            // Form is inline, so we just set state and it updates
        } else {
            const orgMember = member as OrgMember;
            reset(orgMember);
            // Load mandals and villages for existing member
            if (orgMember.district) {
                const mandalsData = await profileApi.getMandals(orgMember.district);
                setMandals(mandalsData);
                if (orgMember.mandal) {
                    const villagesData = await profileApi.getVillages(orgMember.mandal);
                    setVillages(villagesData);
                }
            }
        }
    };

    const handleAdd = () => {
        if (!isOtherOrg) {
            loadDesignations("LLP");
        }
        setEditingOtherMember(null);
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

    // Render Logic differs significantly for OTHERS vs Standard

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                    {isOtherOrg ? "Add Organizations Other Member Details" : "Organization Member Details"}
                </Typography>
                {!isOtherOrg && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                    >
                        Add Member
                    </Button>
                )}
            </Box>

            {isOtherOrg ? (
                // OTHERS View: Form (Inline) -> List (Table) -> Document Upload
                <Box>
                    <OtherMemberForm
                        onSave={onSaveOther}
                        onCancel={handleClose}
                        initialData={editingOtherMember}
                        districts={districts}
                    />

                    {/* List of Members */}
                    <Typography variant="h6" sx={{ mt: 4, mb: 1, color: 'primary.main', visibility: 'hidden' }}>Members List</Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, mb: 4 }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#4fc3f7' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>PAN Number</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Member Type</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 120 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {otherMembers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                            <Typography color="textSecondary">No members added yet</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    otherMembers.map((member) => (
                                        <TableRow key={member.id} hover>
                                            <TableCell>{member.name}</TableCell>
                                            <TableCell>{member.panNumber}</TableCell>
                                            <TableCell>{member.memberType === "OTHERS" ? member.memberTypeOther : member.memberType}</TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    sx={{ mr: 1, minWidth: 0, px: 2 }}
                                                    startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => handleEdit(member)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="error"
                                                    sx={{ minWidth: 0, px: 1, bgcolor: '#d32f2f' }}
                                                    onClick={() => handleDelete(member.id!)}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Document Upload Section */}
                    <Typography variant="h6" sx={{ mt: 2, mb: 2, color: 'success.main', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        Document Upload :
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, bgcolor: '#e0f7fa' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#4fc3f7' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Uploaded Document</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Upload</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 220 }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: 'white' }}>1 Upload Agreement / MoU Copy</TableCell>
                                    <TableCell sx={{ bgcolor: 'white' }}>
                                        <Button
                                            component="label"
                                            size="small"
                                            variant="contained"
                                            sx={{ bgcolor: '#e0e0e0', color: 'black', textTransform: 'none', boxShadow: 'none' }}
                                        >
                                            Choose File
                                            <input type="file" hidden />
                                        </Button>
                                        <Typography component="span" variant="caption" sx={{ ml: 1 }}>No file chosen</Typography>
                                    </TableCell>
                                    <TableCell sx={{ bgcolor: 'white' }}>
                                        <Button variant="contained" size="small" color="warning" sx={{ mr: 1, bgcolor: '#ff9800' }} startIcon={<CloudUploadIcon />}>Upload</Button>
                                        <Button variant="contained" size="small" color="success" startIcon={<AddIcon />}>Add</Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ) : (
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
            )}

            {/* Dialog for Standard Members */}
            <Dialog
                open={isAdding && !isOtherOrg}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
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
