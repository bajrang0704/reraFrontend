"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useParams } from "next/navigation";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControlLabel,
    Checkbox,
    CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { projectApi } from "@/lib/api/project";
import { profileApi } from "@/lib/api/profile";
import { useAuth } from "@/context/AuthContext";
import { Project, PromoterType, AgreementType } from "@/types/project";

const PROMOTER_TYPES: { value: PromoterType; label: string }[] = [
    { value: "INDIVIDUAL", label: "Individual" },
    { value: "COMPANY", label: "Company" },
    { value: "PARTNERSHIP_FIRM", label: "Partnership Firm" },
    { value: "COMPETENT_AUTHORITY", label: "Competent Authority" },
    { value: "LLP", label: "LLP" },
    { value: "TRUST", label: "Trust" },
    { value: "HINDU_UNDIVIDED_FAMILY", label: "Hindu Undivided Family" },
    { value: "OTHERS", label: "Others" },
];

interface PromoterFormData {
    projectUuid: string; // Internal UUID for API calls

    // Promoter Details
    promoterName: string;
    promoterType: PromoterType;
    promoterTypeOther: string;

    // Address
    blockNumber: string;
    buildingName: string;
    streetName: string;
    locality: string;
    landmark: string;
    state: string;
    district: string;
    mandal: string;
    village: string;
    pincode: string;

    // Contact
    contactPersonName: string;
    contactDesignation: string;
    mobileNumber: string;
    officeNumber: string;
    faxNumber: string;
    email: string;

    // Agreement
    agreementType: AgreementType | null;

    // Bank Details (for Area Share only)
    bankName: string;
    accountNumber: string;
    branchName: string;
    bankAddress: string;
    ifscCode: string;
}

const defaultValues: PromoterFormData = {
    projectUuid: "",
    promoterName: "",
    promoterType: "INDIVIDUAL",
    promoterTypeOther: "",
    blockNumber: "",
    buildingName: "",
    streetName: "",
    locality: "",
    landmark: "",
    state: "Telangana",
    district: "",
    mandal: "",
    village: "",
    pincode: "",
    contactPersonName: "",
    contactDesignation: "",
    mobileNumber: "",
    officeNumber: "",
    faxNumber: "",
    email: "",
    agreementType: null,
    // Bank Details
    bankName: "",
    accountNumber: "",
    branchName: "",
    bankAddress: "",
    ifscCode: "",
};

export default function CoPromoterPage() {
    // params available if needed for future use
    const _params = useParams();

    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [promoters, setPromoters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
    const [mandals, setMandals] = useState<{ id: string; name: string }[]>([]);
    const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);
    const [editingPromoterId, setEditingPromoterId] = useState<string | null>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors }
    } = useForm<PromoterFormData>({ defaultValues });

    const selectedPromoterType = watch("promoterType");
    const selectedAgreementType = watch("agreementType");
    const districtId = watch("district");
    const mandalId = watch("mandal");

    // Load Projects and Districts
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user?.loginId) return;
            try {
                // 1. Get Profile UUID
                const profileResponse = await profileApi.getProfile(user.loginId);
                const profileObj = (profileResponse as any).data || profileResponse.profile;
                const profileUuid = profileObj?.id;

                if (!profileUuid) throw new Error("Profile not found");

                // 2. Get Projects with hasOtherPromoters filter (backend filtering)
                const allowedProjects = await projectApi.listProjects(profileUuid, true);
                setProjects(allowedProjects);

                // 3. Get Districts (State is fixed)
                const districtData = await profileApi.getDistricts("TS");
                setDistricts(districtData.map((d: any) => ({ id: d.code, name: d.name })));

            } catch (err: any) {
                console.error("Failed to load data", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadInitialData();
        }
    }, [user]);

    // Load Mandals when District changes
    useEffect(() => {
        if (districtId) {
            profileApi.getMandals(districtId).then(data => {
                setMandals(data.map((m: any) => ({ id: m.code, name: m.name })));
            });
        }
    }, [districtId]);

    // Load Villages when Mandal changes
    useEffect(() => {
        if (mandalId) {
            profileApi.getVillages(mandalId).then(data => {
                setVillages(data.map((v: any) => ({ id: v.code, name: v.name })));
            });
        }
    }, [mandalId]);

    // Handle Project Selection
    const handleProjectChange = async (projectUuid: string) => {
        const project = projects.find(p => p.id === projectUuid);
        console.log("DEBUG: Selected Project:", project);
        setSelectedProject(project || null);
        setValue("projectUuid", projectUuid);
        setPromoters([]); // Clear list

        if (project) {
            try {
                // Fetch full project details to ensure we have the Display ID (projectId)
                const fullProjectResponse = await projectApi.getProject(projectUuid);
                const fullProject = fullProjectResponse.data;
                console.log("DEBUG: Full Project Details:", fullProject);
                setSelectedProject(fullProject);

                const realProjectId = fullProject.projectId || fullProject.id;
                const list = await projectApi.getOtherPromoters(realProjectId);
                setPromoters(list);
            } catch (e) {
                console.error("Failed to fetch project/promoters", e);
                // Fallback to local project if fetch fails
                setSelectedProject(project);
            }
        }
    };

    const onSubmit = async (data: PromoterFormData) => {
        if (!selectedProject) return;
        if (!data.agreementType) {
            alert("Please select an Agreement Type");
            return;
        }

        try {
            // Build promoter payload (excluding bank details)
            const { bankName, accountNumber, branchName, bankAddress, ifscCode, ...promoterData } = data;
            const payload = {
                ...promoterData,
                promoterTypeOther: data.promoterType === "OTHERS" ? data.promoterTypeOther : null,
            };

            let promoterId = editingPromoterId;

            const apiProjectId = selectedProject.projectId || selectedProject.id;
            console.log("DEBUG: Adding Promoter - Project ID:", apiProjectId);

            if (editingPromoterId) {
                await projectApi.updateOtherPromoter(apiProjectId, editingPromoterId, payload);
            } else {
                console.log("DEBUG: Payload:", payload);
                const result = await projectApi.addOtherPromoter(apiProjectId, payload);
                promoterId = result.data?.id;
            }

            // If Area Share, save bank details separately
            if (data.agreementType === "AREA_SHARE" && promoterId) {
                const bankPayload = {
                    bankName,
                    accountNumber,
                    branchName,
                    bankAddress,
                    ifscCode,
                };
                await projectApi.upsertPromoterBankDetails(apiProjectId, promoterId, bankPayload);
            }

            // Refresh list
            const list = await projectApi.getOtherPromoters(apiProjectId);
            setPromoters(list);

            // Reset form but keep project selected
            reset({ ...defaultValues, projectUuid: selectedProject.id });
            setEditingPromoterId(null);

        } catch (err: any) {
            console.error("Failed to save promoter", err);
            alert(err.response?.data?.error || "Failed to save promoter");
        }
    };


    const handleEdit = (p: any) => {
        setEditingPromoterId(p.id);
        reset({
            projectUuid: selectedProject?.id || "",
            promoterName: p.promoterName,
            promoterType: p.promoterType,
            promoterTypeOther: p.promoterTypeOther || "",
            blockNumber: p.blockNumber,
            buildingName: p.buildingName,
            streetName: p.streetName,
            locality: p.locality,
            landmark: p.landmark,
            state: p.state,
            district: p.district,
            mandal: p.mandal,
            village: p.village,
            pincode: p.pincode,
            contactPersonName: p.contactPersonName,
            contactDesignation: p.contactDesignation,
            mobileNumber: p.mobileNumber,
            officeNumber: p.officeNumber || "",
            faxNumber: p.faxNumber || "",
            email: p.email,
            agreementType: p.agreementType,
            // Bank Details (for Area Share)
            bankName: p.bankDetails?.bankName || "",
            accountNumber: p.bankDetails?.accountNumber || "",
            branchName: p.bankDetails?.branchName || "",
            bankAddress: p.bankDetails?.bankAddress || "",
            ifscCode: p.bankDetails?.ifscCode || "",
        });
    };


    const handleDelete = async (id: string) => {
        if (!selectedProject || !confirm("Are you sure?")) return;
        try {
            const apiProjectId = selectedProject.projectId || selectedProject.id;
            await projectApi.deleteOtherPromoter(apiProjectId, id);
            const list = await projectApi.getOtherPromoters(apiProjectId);
            setPromoters(list);
        } catch (e) {
            alert("Failed to delete");
        }
    };

    if (loading) return <CircularProgress sx={{ m: 4 }} />;

    return (
        <Box sx={{ maxWidth: 1400, mx: "auto", p: 2 }}>
            <Typography variant="h5" sx={{ mb: 1, borderBottom: "2px solid #ccc", pb: 1 }}>
                Add Co-Promoter Details
            </Typography>

            <Typography variant="body2" sx={{ color: "error.main", mb: 3 }}>
                All * Mark field are mandatory.
            </Typography>

            {/* Project Selection */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
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
                    {projects.length === 0 && (
                        <Typography variant="caption" color="textSecondary">
                            No projects with "Co-Promoters" enabled found.
                        </Typography>
                    )}
                </Grid>
            </Grid>

            {/* Form - Only show if project selected */}
            {selectedProject && (
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>

                    {/* Promoter Details */}
                    <Typography variant="subtitle1" sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                        Co-Promoter(Land Owner/ Investor) Details
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Co-Promoter Name *" InputLabelProps={{ shrink: true }} {...register("promoterName", { required: "Required" })} error={!!errors.promoterName} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                size="small"
                                select
                                fullWidth
                                label="Type of Co-Promoter *"
                                InputLabelProps={{ shrink: true }}
                                {...register("promoterType", { required: "Required" })}
                                error={!!errors.promoterType}
                                value={watch("promoterType") || ""}
                            >
                                {PROMOTER_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                            </TextField>
                        </Grid>
                        {selectedPromoterType === "OTHERS" && (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField size="small" fullWidth label="Specify Other Type *" InputLabelProps={{ shrink: true }} {...register("promoterTypeOther", { required: "Required" })} error={!!errors.promoterTypeOther} />
                            </Grid>
                        )}
                    </Grid>

                    {/* Address Details */}
                    <Typography variant="subtitle1" sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                        Address for Official communication:
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {/* Address Fields reused */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Block Number *" InputLabelProps={{ shrink: true }} {...register("blockNumber", { required: "Required" })} error={!!errors.blockNumber} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Building Name *" InputLabelProps={{ shrink: true }} {...register("buildingName", { required: "Required" })} error={!!errors.buildingName} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Street Name *" InputLabelProps={{ shrink: true }} {...register("streetName", { required: "Required" })} error={!!errors.streetName} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Locality *" InputLabelProps={{ shrink: true }} {...register("locality", { required: "Required" })} error={!!errors.locality} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Landmark *" InputLabelProps={{ shrink: true }} {...register("landmark", { required: "Required" })} error={!!errors.landmark} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="State *" value="Telangana" disabled InputLabelProps={{ shrink: true }} {...register("state")} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="district"
                                control={control}
                                rules={{ required: "Required" }}
                                render={({ field }) => (
                                    <TextField {...field} select size="small" fullWidth label="District *" InputLabelProps={{ shrink: true }} error={!!errors.district}>
                                        <MenuItem value="">Select District</MenuItem>
                                        {districts.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                                    </TextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="mandal"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select size="small" fullWidth label="Mandal" InputLabelProps={{ shrink: true }} disabled={!districtId}>
                                        <MenuItem value="">Select Mandal</MenuItem>
                                        {mandals.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                                    </TextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="village"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select size="small" fullWidth label="Village" InputLabelProps={{ shrink: true }} disabled={!mandalId}>
                                        <MenuItem value="">Select Village</MenuItem>
                                        {villages.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                                    </TextField>
                                )}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Pin Code *" InputLabelProps={{ shrink: true }} {...register("pincode", { required: "Required", pattern: { value: /^[0-9]{6}$/, message: "Invalid Pincode" } })} error={!!errors.pincode} />
                        </Grid>
                    </Grid>

                    {/* Contact Details */}
                    <Typography variant="subtitle1" sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                        Contact Details:
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Name of Contact Person *" InputLabelProps={{ shrink: true }} {...register("contactPersonName", { required: "Required" })} error={!!errors.contactPersonName} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Contact Designation *" InputLabelProps={{ shrink: true }} {...register("contactDesignation", { required: "Required" })} error={!!errors.contactDesignation} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Mobile Number *" InputLabelProps={{ shrink: true }} {...register("mobileNumber", { required: "Required" })} error={!!errors.mobileNumber} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Office Number" InputLabelProps={{ shrink: true }} {...register("officeNumber")} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Fax Number" InputLabelProps={{ shrink: true }} {...register("faxNumber")} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField size="small" fullWidth label="Email ID *" InputLabelProps={{ shrink: true }} {...register("email", { required: "Required" })} error={!!errors.email} />
                        </Grid>
                    </Grid>

                    {/* Agreement Type */}
                    <Box display="flex" alignItems="center" gap={4} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#d32f2f" }}>Type of Agreement/ Arrangement *</Typography>
                        <FormControlLabel
                            control={<Checkbox checked={selectedAgreementType === "REVENUE_SHARE"} onChange={() => setValue("agreementType", "REVENUE_SHARE")} />}
                            label="Revenue Share"
                        />
                        <FormControlLabel
                            control={<Checkbox checked={selectedAgreementType === "AREA_SHARE"} onChange={() => setValue("agreementType", "AREA_SHARE")} />}
                            label="Area Share"
                        />
                    </Box>

                    {/* Bank Details - Only for Area Share */}
                    {selectedAgreementType === "AREA_SHARE" && (
                        <>
                            <Typography variant="subtitle1" sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                                Details of separate bank account as per section 4 (2)(I)(D) of the Act :
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField size="small" fullWidth label="Bank Name *" InputLabelProps={{ shrink: true }} {...register("bankName", { required: selectedAgreementType === "AREA_SHARE" ? "Required" : false })} error={!!errors.bankName} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField size="small" fullWidth label="Bank A/c Number *" InputLabelProps={{ shrink: true }} {...register("accountNumber", { required: selectedAgreementType === "AREA_SHARE" ? "Required" : false })} error={!!errors.accountNumber} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField size="small" fullWidth label="Branch Name *" InputLabelProps={{ shrink: true }} {...register("branchName", { required: selectedAgreementType === "AREA_SHARE" ? "Required" : false })} error={!!errors.branchName} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField size="small" fullWidth label="Bank Address *" InputLabelProps={{ shrink: true }} {...register("bankAddress", { required: selectedAgreementType === "AREA_SHARE" ? "Required" : false })} error={!!errors.bankAddress} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField size="small" fullWidth label="IFSC Code *" InputLabelProps={{ shrink: true }} {...register("ifscCode", { required: selectedAgreementType === "AREA_SHARE" ? "Required" : false })} error={!!errors.ifscCode} />
                                </Grid>
                            </Grid>
                        </>
                    )}


                    <Button type="submit" variant="contained" color="success" sx={{ mb: 2 }}>
                        {editingPromoterId ? "Update Co-Promoter" : "Add Co-Promoter"}
                    </Button>

                    {editingPromoterId && (
                        <Button variant="outlined" onClick={() => { setEditingPromoterId(null); reset({ ...defaultValues, projectUuid: selectedProject.id }); }} sx={{ ml: 2, mb: 2 }}>
                            Cancel
                        </Button>
                    )}

                    <Typography variant="caption" display="block" color="error" sx={{ fontStyle: "italic", mb: 4 }}>
                        * After Adding Co-Promoter (Land Owner / Investor) Click on Upload document.
                    </Typography>

                </Box>
            )}

            {/* List Table */}
            {selectedProject && (
                <TableContainer component={Paper} elevation={3}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: "#5d99c6" }}>
                            <TableRow>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>SR.NO.</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Co-Promoter Name</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Pin Code</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name of Contact Person</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Contact Designation</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Mobile Number</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email ID</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Upload Document</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {promoters.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>No Co-Promoters Added</TableCell>
                                </TableRow>
                            ) : (
                                promoters.map((p, index) => (
                                    <TableRow key={p.id} hover>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{p.promoterName}</TableCell>
                                        <TableCell>{p.pincode}</TableCell>
                                        <TableCell>{p.contactPersonName}</TableCell>
                                        <TableCell>{p.contactDesignation}</TableCell>
                                        <TableCell>{p.mobileNumber}</TableCell>
                                        <TableCell>{p.email}</TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                <Button size="small" variant="contained" color="primary" onClick={() => handleEdit(p)}>
                                                    Action
                                                </Button>
                                                <Button size="small" variant="contained" color="error" onClick={() => handleDelete(p.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </Button>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Button size="small" variant="contained" color="warning" startIcon={<UploadFileIcon />}>
                                                Upload
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
