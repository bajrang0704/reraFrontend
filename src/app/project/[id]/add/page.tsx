"use client";

import { useState, useEffect, use } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { projectApi } from "@/lib/api/project";
import { profileApi } from "@/lib/api/profile";
import {
    Project,
    AuthorityName,
    ProjectType,
    ProjectStatusType,
    BankAccountType,
} from "@/types/project";
import { useAuth } from "@/context/AuthContext";
import {
    Box,
    Button,
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
    Grid,
    Alert,
    FormControlLabel,
    Radio,
    RadioGroup,
    FormLabel,
    Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import LocationPicker from "@/components/common/LocationPicker";

// Dropdown options
const AUTHORITY_OPTIONS: { value: AuthorityName; label: string }[] = [
    { value: "DTCP", label: "DTCP" },
    { value: "GHMC", label: "GHMC" },
    { value: "TGIIC", label: "TGIIC" },
    { value: "HMDA", label: "HMDA" },
];

const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "PLOTTED_DEVELOPMENT", label: "Plotted Development" },
    { value: "MIXED_DEVELOPMENT", label: "Mixed Development" },
];

const PROJECT_STATUS_OPTIONS: { value: ProjectStatusType; label: string }[] = [
    { value: "NEW", label: "New Project" },
    { value: "ONGOING", label: "Ongoing Project" },
];

// Form Data Interface
interface ProjectFormData {
    // Project Info
    authorityName: AuthorityName;
    planApprovalNumber: string;
    projectName: string;
    projectType: ProjectType;
    projectStatus: ProjectStatusType;
    approvedDate: string;
    proposedCompletionDate: string;
    revisedProposedCompletionDate: string;
    hasLitigations: string; // "true" or "false" for radio
    hasOtherPromoters: string;
    isMsbOrHighrise: string;

    // Land Details
    surveyNo: string;
    plotOrHouseNo: string;
    totalAreaSqm: number;
    areaAffectedSqm: number;
    netAreaSqm: number;
    approvedBuildingUnits: number;
    proposedBuildingUnits: number;
    boundaryEast: string;
    boundaryWest: string;
    boundaryNorth: string;
    boundarySouth: string;

    // Builtup Details
    approvedBuiltupAreaSqm: number;
    mortgageAreaSqm: number;

    // Address
    state: string;
    district: string;
    mandal: string;
    city: string;
    street: string;
    locality: string;
    pincode: string;
    village: string;

    // GIS
    latitude: number;
    longitude: number;

    // Bank Details - Collection Account (100%)
    collectionAccountId?: string;
    collectionBankName: string;
    collectionBranchName: string;

    collectionIfscCode: string;
    collectionAccountNumber: string;
    collectionBankAddress: string;

    // Bank Details - Separate Account (70%)
    separateAccountId?: string;
    separateBankName: string;
    separateBranchName: string;

    separateIfscCode: string;
    separateAccountNumber: string;
    separateBankAddress: string;

    // Bank Details - Transaction Account (30%)
    transactionAccountId?: string;
    transactionBankName: string;
    transactionBranchName: string;

    transactionIfscCode: string;
    transactionAccountNumber: string;
    transactionBankAddress: string;
}

const defaultValues: ProjectFormData = {
    authorityName: "GHMC",
    planApprovalNumber: "",
    projectName: "",
    projectType: "RESIDENTIAL",
    projectStatus: "NEW",
    approvedDate: "",
    proposedCompletionDate: "",
    revisedProposedCompletionDate: "",
    hasLitigations: "false",
    hasOtherPromoters: "false",
    isMsbOrHighrise: "false",
    surveyNo: "",
    plotOrHouseNo: "",
    totalAreaSqm: 0,
    areaAffectedSqm: 0,
    netAreaSqm: 0,
    approvedBuildingUnits: 0,
    proposedBuildingUnits: 0,
    boundaryEast: "",
    boundaryWest: "",
    boundaryNorth: "",
    boundarySouth: "",
    approvedBuiltupAreaSqm: 0,
    mortgageAreaSqm: 0,
    state: "Telangana",
    district: "",
    mandal: "",
    city: "",
    street: "",
    locality: "",
    pincode: "",
    village: "",
    latitude: 0,
    longitude: 0,

    // Bank Details Defaults
    collectionAccountId: "",
    collectionBankName: "",
    collectionBranchName: "",

    collectionIfscCode: "",
    collectionAccountNumber: "",
    collectionBankAddress: "",

    separateAccountId: "",
    separateBankName: "",
    separateBranchName: "",

    separateIfscCode: "",
    separateAccountNumber: "",
    separateBankAddress: "",

    transactionAccountId: "",
    transactionBankName: "",
    transactionBranchName: "",

    transactionIfscCode: "",
    transactionAccountNumber: "",
    transactionBankAddress: "",
};



const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
    } catch (e) {
        return "";
    }
};

export default function AddProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const decodedId = decodeURIComponent(id);
    const router = useRouter();
    const { user } = useAuth();

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [canEditBuildingUnits, setCanEditBuildingUnits] = useState(true);
    const [isMapOpen, setIsMapOpen] = useState(false);


    // Location dropdowns
    // State is fixed to Telangana
    const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
    const [mandals, setMandals] = useState<{ id: string; name: string }[]>([]);
    const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ProjectFormData>({ defaultValues });

    const selectedState = watch("state");
    const selectedDistrict = watch("district");
    const selectedMandal = watch("mandal");

    // Load projects and districts on mount (state is fixed to Telangana)
    useEffect(() => {
        if (user?.loginId) {
            loadProjects();
        }
        loadDistricts();
    }, [user?.loginId]);

    // Load districts when state changes
    // State is fixed, so no need to reload districts on state change

    // Load mandals when district changes
    // Removed useEffect to avoid conflict with reset()

    // Load villages when mandal changes
    // Removed useEffect to avoid conflict with reset()

    const loadProjects = async () => {
        if (!user?.loginId) {
            setLoading(false);
            return;
        }
        try {
            // First, get Profile UUID from the profile endpoint
            const profileResponse = await profileApi.getProfile(user.loginId);
            const profileObj = (profileResponse as any).data || profileResponse.profile;
            const profileUuid = profileObj?.id;

            if (!profileUuid) {
                console.error("Could not get Profile UUID");
                setLoading(false);
                return;
            }

            // Now list projects using the Profile UUID
            const data = await projectApi.listProjects(profileUuid);
            setProjects(data);
        } catch (err: any) {
            console.error("Failed to load projects", err);
        } finally {
            setLoading(false);
        }
    };

    // State is fixed to Telangana, no need for loadStates

    const loadDistricts = async () => {
        try {
            const data = await profileApi.getDistricts("TS");
            setDistricts(data.map((d: any) => ({ id: d.code, name: d.name })));
        } catch (err) {
            console.error("Failed to load districts", err);
        }
    };

    const loadMandals = async (districtCode: string) => {
        try {
            const data = await profileApi.getMandals(districtCode);
            setMandals(data.map((m: any) => ({ id: m.code, name: m.name })));
        } catch (err) {
            console.error("Failed to load mandals", err);
        }
    };

    const loadVillages = async (mandalCode: string) => {
        try {
            const data = await profileApi.getVillages(mandalCode);
            setVillages(data.map((v: any) => ({ id: v.code, name: v.name })));
        } catch (err) {
            console.error("Failed to load villages", err);
        }
    };

    const onSubmit = async (data: ProjectFormData) => {
        if (!user?.loginId) return;
        setError(null);

        try {
            // 1. Construct the Main Project Payload
            const projectPayload: any = {
                authorityName: data.authorityName,
                planApprovalNumber: data.planApprovalNumber,
                projectName: data.projectName,
                projectType: data.projectType,
                projectStatus: data.projectStatus,
                approvedDate: data.approvedDate,
                proposedCompletionDate: data.proposedCompletionDate,
                revisedProposedCompletionDate: data.revisedProposedCompletionDate || null,
                hasLitigations: data.hasLitigations === "true",
                hasOtherPromoters: data.hasOtherPromoters === "true",
                isMsbOrHighrise: data.isMsbOrHighrise === "true",
            };

            // 2. Prepare Sub-Objects

            // Land Details
            const landDetail = {
                surveyNo: data.surveyNo,
                plotOrHouseNo: data.plotOrHouseNo,
                totalAreaSqm: data.totalAreaSqm,
                areaAffectedSqm: data.areaAffectedSqm,
                netAreaSqm: data.netAreaSqm,
                approvedBuildingUnits: data.approvedBuildingUnits,
                proposedBuildingUnits: data.proposedBuildingUnits,
                boundaryEast: data.boundaryEast,
                boundaryWest: data.boundaryWest,
                boundaryNorth: data.boundaryNorth,
                boundarySouth: data.boundarySouth,
            };

            // Builtup Details
            const builtupDetail = {
                approvedBuiltupAreaSqm: data.approvedBuiltupAreaSqm,
                mortgageAreaSqm: data.mortgageAreaSqm,
            };

            // Address
            const address = {
                state: data.state,
                district: data.district,
                mandal: data.mandal,
                village: data.village,
                city: data.city,
                street: data.street,
                locality: data.locality,
                pincode: data.pincode,
            };

            // GIS
            const gis = {
                latitude: data.latitude,
                longitude: data.longitude,
            };

            // Bank Accounts
            const bankAccounts: any[] = [];

            if (data.collectionBankName) {
                bankAccounts.push({
                    accountType: "COLLECTION_100",
                    bankName: data.collectionBankName,
                    branchName: data.collectionBranchName,
                    ifscCode: data.collectionIfscCode,
                    accountNumber: data.collectionAccountNumber,
                    bankAddress: data.collectionBankAddress,
                    // If editing, you might add id: data.collectionAccountId but unified API might just replace
                });
            }

            if (data.separateBankName) {
                bankAccounts.push({
                    accountType: "SEPARATE_70",
                    bankName: data.separateBankName,
                    branchName: data.separateBranchName,
                    ifscCode: data.separateIfscCode,
                    accountNumber: data.separateAccountNumber,
                    bankAddress: data.separateBankAddress,
                });
            }

            if (data.transactionBankName) {
                bankAccounts.push({
                    accountType: "TRANSACTION_30",
                    bankName: data.transactionBankName,
                    branchName: data.transactionBranchName,
                    ifscCode: data.transactionIfscCode,
                    accountNumber: data.transactionAccountNumber,
                    bankAddress: data.transactionBankAddress,
                });
            }

            // 3. Determine if Create (Unified) or Update (Legacy/Specific)
            // NOTE: For 'Edit', we ideally usually still update sections individually or have a unified update.
            // The requirement specifically asked for Unified Creation.
            // If editingProjectId exists, we'll keep the old update logic OR check if we should just call updateProject
            // For now, let's assume Unified is only for NEW projects as requested.

            if (editingProjectId) {
                // --- UPDATE FLOW (Legacy/Existing) ---
                // Update Base Project
                await projectApi.updateProject(editingProjectId, projectPayload);

                // Update details independently as before
                await projectApi.upsertLandDetails(editingProjectId, landDetail);
                await projectApi.upsertBuiltupDetails(editingProjectId, builtupDetail);
                await projectApi.upsertAddress(editingProjectId, address);
                if (data.latitude || data.longitude) await projectApi.upsertGIS(editingProjectId, gis);

                // Update Bank Accounts (Complex logic kept)
                // Collection
                if (data.collectionBankName) {
                    const payload: any = { ...bankAccounts.find(b => b.accountType === 'COLLECTION_100') };
                    if (data.collectionAccountId) await projectApi.updateBankAccount(editingProjectId, data.collectionAccountId, payload);
                    else await projectApi.addBankAccount(editingProjectId, payload);
                }
                // Separate
                if (data.separateBankName) {
                    const payload: any = { ...bankAccounts.find(b => b.accountType === 'SEPARATE_70') };
                    if (data.separateAccountId) await projectApi.updateBankAccount(editingProjectId, data.separateAccountId, payload);
                    else await projectApi.addBankAccount(editingProjectId, payload);
                }
                // Transaction
                if (data.transactionBankName) {
                    const payload: any = { ...bankAccounts.find(b => b.accountType === 'TRANSACTION_30') };
                    if (data.transactionAccountId) await projectApi.updateBankAccount(editingProjectId, data.transactionAccountId, payload);
                    else await projectApi.addBankAccount(editingProjectId, payload);
                }

                alert("Project updated successfully!");
                reset(defaultValues);
                setEditingProjectId(null);
                loadProjects();

            } else {
                // --- CREATE FLOW (Unified) ---
                let profileUuid = decodedId;

                // Resolve Profile UUID if needed
                if (decodedId.includes("TSRERA") || !decodedId.includes("-")) {
                    try {
                        const profileResponse = await profileApi.getProfile(decodedId);
                        const profileObj = (profileResponse as any).data || profileResponse.profile;
                        if (profileObj && profileObj.id) {
                            profileUuid = profileObj.id;
                        } else {
                            throw new Error("Could not retrieve Profile UUID");
                        }
                    } catch (e) {
                        console.error("Failed to resolve Profile UUID", e);
                        alert("Error: Could not resolve Profile ID. Please check your network connection.");
                        return;
                    }
                }

                // Construct Full Payload
                const fullPayload = {
                    ...projectPayload,
                    landDetail,
                    builtupDetail,
                    address,
                    gis,
                    bankAccounts
                };

                // Call Unified Endpoint
                await projectApi.createProjectFull(profileUuid, fullPayload);

                alert("Project created successfully!");
                reset(defaultValues);
                loadProjects();
            }

        } catch (err: any) {
            console.error("Failed to save project", err);
            // Handle various error response formats
            const errorData = err.response?.data;
            let errorMessage = "Failed to save project";

            if (typeof errorData === "string") {
                errorMessage = errorData;
            } else if (errorData?.error) {
                if (typeof errorData.error === "string") {
                    errorMessage = errorData.error;
                } else if (errorData.error.formErrors?.length) {
                    errorMessage = errorData.error.formErrors.join(", ");
                } else if (errorData.error.fieldErrors) {
                    // Convert field errors to readable format
                    const fieldMessages = Object.entries(errorData.error.fieldErrors)
                        .map(([field, errors]) => `${field}: ${(errors as string[]).join(", ")}`)
                        .join("; ");
                    errorMessage = fieldMessages || "Validation failed";
                }
            } else if (errorData?.message) {
                errorMessage = errorData.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        }
    };

    const handleEdit = async (project: Project) => {
        // Use id (UUID) for API calls - display IDs are for UI only
        setEditingProjectId(project.id);

        // Get full project details
        try {
            const result = await projectApi.getProject(project.id);
            const p = result.data;
            setCanEditBuildingUnits(result.canEditTotalBuildingUnits !== false);

            const collectionAcc = p.bankAccounts?.find((b) => b.accountType === "COLLECTION_100");
            const separateAcc = p.bankAccounts?.find((b) => b.accountType === "SEPARATE_70");
            const transactionAcc = p.bankAccounts?.find((b) => b.accountType === "TRANSACTION_30");

            // Load district, mandal, and village for the address (state is fixed to Telangana)
            await loadDistricts();
            if (p.address?.district) {
                await loadMandals(p.address.district);
                if (p.address?.mandal) {
                    await loadVillages(p.address.mandal);
                }
            }

            console.log("DEBUG ADDRESS KEYS:", Object.keys(p.address || {}));
            console.log("DEBUG VILLAGE VALUES:", {
                v: p.address?.village,
                vc: (p.address as any)?.villageCode,
                v_c: (p.address as any)?.village_code
            });

            reset({
                authorityName: p.authorityName,
                planApprovalNumber: p.planApprovalNumber,
                projectName: p.projectName,
                projectType: p.projectType,
                projectStatus: p.projectStatus,
                approvedDate: formatDateForInput(p.approvedDate),
                proposedCompletionDate: formatDateForInput(p.proposedCompletionDate),
                revisedProposedCompletionDate: formatDateForInput(p.revisedProposedCompletionDate),
                hasLitigations: p.hasLitigations ? "true" : "false",
                hasOtherPromoters: p.hasOtherPromoters ? "true" : "false",
                isMsbOrHighrise: p.isMsbOrHighrise ? "true" : "false",
                surveyNo: p.landDetail?.surveyNo || "",
                plotOrHouseNo: p.landDetail?.plotOrHouseNo || "",
                totalAreaSqm: p.landDetail?.totalAreaSqm || 0,
                areaAffectedSqm: p.landDetail?.areaAffectedSqm || 0,
                netAreaSqm: p.landDetail?.netAreaSqm || 0,
                approvedBuildingUnits: p.landDetail?.approvedBuildingUnits || 0,
                proposedBuildingUnits: p.landDetail?.proposedBuildingUnits || 0,
                boundaryEast: p.landDetail?.boundaryEast || "",
                boundaryWest: p.landDetail?.boundaryWest || "",
                boundaryNorth: p.landDetail?.boundaryNorth || "",
                boundarySouth: p.landDetail?.boundarySouth || "",
                approvedBuiltupAreaSqm: p.builtupDetail?.approvedBuiltupAreaSqm || 0,
                mortgageAreaSqm: p.builtupDetail?.mortgageAreaSqm || 0,
                state: p.address?.state || "",
                district: p.address?.district || "",
                mandal: p.address?.mandal || "",
                village: p.address?.village || "",
                city: p.address?.city || "",
                street: p.address?.street || "",
                locality: p.address?.locality || "",
                pincode: p.address?.pincode || "",

                // Bank Details
                collectionAccountId: collectionAcc?.id || "",
                collectionBankName: collectionAcc?.bankName || "",
                collectionBranchName: collectionAcc?.branchName || "",
                collectionIfscCode: collectionAcc?.ifscCode || "",
                collectionAccountNumber: collectionAcc?.accountNumber || "",
                collectionBankAddress: collectionAcc?.bankAddress || "",

                separateAccountId: separateAcc?.id || "",
                separateBankName: separateAcc?.bankName || "",
                separateBranchName: separateAcc?.branchName || "",
                separateIfscCode: separateAcc?.ifscCode || "",
                separateAccountNumber: separateAcc?.accountNumber || "",
                separateBankAddress: separateAcc?.bankAddress || "",

                transactionAccountId: transactionAcc?.id || "",
                transactionBankName: transactionAcc?.bankName || "",
                transactionBranchName: transactionAcc?.branchName || "",
                transactionIfscCode: transactionAcc?.ifscCode || "",
                transactionAccountNumber: transactionAcc?.accountNumber || "",
                transactionBankAddress: transactionAcc?.bankAddress || "",
                latitude: p.gis?.latitude || 0,
                longitude: p.gis?.longitude || 0,
            });

        } catch (err) {
            console.error("Failed to load project details", err);
        }
    };

    const handleDelete = async (projectId: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await projectApi.deleteProject(projectId);
            loadProjects();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to delete project");
        }
    };

    const handleCancel = () => {
        setEditingProjectId(null);
        reset(defaultValues);
        setCanEditBuildingUnits(true);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1400, mx: "auto", p: 2 }}>
            <Typography variant="h5" sx={{ mb: 1, borderBottom: "2px solid #ccc", pb: 1 }}>
                Add Project
            </Typography>

            <Typography variant="body2" sx={{ color: "error.main", mb: 2 }}>
                All * Mark field are mandatory.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                {/* Project Information Section */}
                <Typography variant="subtitle1" sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                    Project Information
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="authorityName"
                            control={control}
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                                <TextField {...field} size="small" select fullWidth label="Authority Name *" error={!!errors.authorityName}>
                                    {AUTHORITY_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="projectType"
                            control={control}
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                                <TextField {...field} size="small" select fullWidth label="Project Type *" error={!!errors.projectType}>
                                    {PROJECT_TYPE_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Plan Approval Number *" InputLabelProps={{ shrink: true }} {...register("planApprovalNumber", { required: "Required" })} error={!!errors.planApprovalNumber} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Revised Proposed Date of Completion" type="date" InputLabelProps={{ shrink: true }} {...register("revisedProposedCompletionDate")} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Project Name *" InputLabelProps={{ shrink: true }} {...register("projectName", { required: "Required" })} error={!!errors.projectName} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box>
                            <FormLabel>Project Status *</FormLabel>
                            <Controller
                                name="projectStatus"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup {...field} row>
                                        {PROJECT_STATUS_OPTIONS.map((opt) => (
                                            <FormControlLabel key={opt.value} value={opt.value} control={<Radio size="small" />} label={opt.label} />
                                        ))}
                                    </RadioGroup>
                                )}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Approved Date *" type="date" InputLabelProps={{ shrink: true }} {...register("approvedDate", { required: "Required" })} error={!!errors.approvedDate} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box>
                            <FormLabel>Is litigation pending concerning the land *</FormLabel>
                            <Controller
                                name="hasLitigations"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup {...field} row>
                                        <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                                        <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                                    </RadioGroup>
                                )}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Proposed Date of Completion *" type="date" InputLabelProps={{ shrink: true }} {...register("proposedCompletionDate", { required: "Required" })} error={!!errors.proposedCompletionDate} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box>
                            <FormLabel>Whether more promoters in the project? *</FormLabel>
                            <Controller
                                name="hasOtherPromoters"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup {...field} row>
                                        <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                                        <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                                    </RadioGroup>
                                )}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box>
                            <FormLabel>Is MSB / Highrise? *</FormLabel>
                            <Controller
                                name="isMsbOrHighrise"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup {...field} row>
                                        <FormControlLabel value="true" control={<Radio size="small" />} label="Yes" />
                                        <FormControlLabel value="false" control={<Radio size="small" />} label="No" />
                                    </RadioGroup>
                                )}
                            />
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Land Details Section */}
                <Typography variant="subtitle1" sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                    Land Details
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Survey No. *" InputLabelProps={{ shrink: true }} {...register("surveyNo", { required: "Required" })} error={!!errors.surveyNo} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="No. of Approved Building Units *" type="number" InputLabelProps={{ shrink: true }} disabled={!canEditBuildingUnits} {...register("approvedBuildingUnits", { required: "Required", valueAsNumber: true })} error={!!errors.approvedBuildingUnits} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Plot/House No. *" InputLabelProps={{ shrink: true }} {...register("plotOrHouseNo", { required: "Required" })} error={!!errors.plotOrHouseNo} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Proposed No. of Building/Plot/Blocks *" type="number" InputLabelProps={{ shrink: true }} disabled={!canEditBuildingUnits} {...register("proposedBuildingUnits", { required: "Required", valueAsNumber: true })} error={!!errors.proposedBuildingUnits} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Total Extent of Land (in SQM) *" type="number" InputLabelProps={{ shrink: true }} {...register("totalAreaSqm", { required: "Required", valueAsNumber: true })} error={!!errors.totalAreaSqm} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Boundary East" InputLabelProps={{ shrink: true }} {...register("boundaryEast")} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Area affected Under Road (SQM)" type="number" InputLabelProps={{ shrink: true }} {...register("areaAffectedSqm", { valueAsNumber: true })} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Boundary West" InputLabelProps={{ shrink: true }} {...register("boundaryWest")} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Net Land Area (SQM) *" type="number" InputLabelProps={{ shrink: true }} {...register("netAreaSqm", { required: "Required", valueAsNumber: true })} error={!!errors.netAreaSqm} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Boundary North" InputLabelProps={{ shrink: true }} {...register("boundaryNorth")} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}></Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Boundary South" InputLabelProps={{ shrink: true }} {...register("boundarySouth")} />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Builtup Details Section */}
                <Typography variant="subtitle1" sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                    Built-Up Area Details
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Approved Builtup Area (SQM) *" type="number" InputLabelProps={{ shrink: true }} {...register("approvedBuiltupAreaSqm", { required: "Required", valueAsNumber: true })} error={!!errors.approvedBuiltupAreaSqm} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Area Under Mortgage (SQM)" type="number" InputLabelProps={{ shrink: true }} {...register("mortgageAreaSqm", { valueAsNumber: true })} />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Address Section */}
                <Typography variant="subtitle1" sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                    Address Details
                </Typography>


                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="State *"
                            value="Telangana"
                            disabled
                            {...register("state")}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Street" InputLabelProps={{ shrink: true }} {...register("street")} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="district"
                            control={control}
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    size="small"
                                    select
                                    fullWidth
                                    label="District *"
                                    error={!!errors.district}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        const newVal = e.target.value;
                                        if (newVal) {
                                            loadMandals(newVal);
                                            setValue("mandal", "");
                                            setValue("village", "");
                                            setVillages([]);
                                        }
                                    }}
                                >
                                    <MenuItem value="">Select District</MenuItem>
                                    {districts.map((d) => (
                                        <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Locality" InputLabelProps={{ shrink: true }} {...register("locality")} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="mandal"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    size="small"
                                    select
                                    fullWidth
                                    label="Mandal"
                                    disabled={!selectedDistrict}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        const newVal = e.target.value;
                                        if (newVal) {
                                            loadVillages(newVal);
                                            setValue("village", "");
                                        }
                                    }}
                                >
                                    <MenuItem value="">Select Mandal</MenuItem>
                                    {mandals.map((m) => (
                                        <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Pincode *" InputLabelProps={{ shrink: true }} {...register("pincode", { required: "Required" })} error={!!errors.pincode} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="village"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} size="small" select fullWidth label="Village" disabled={!selectedMandal}>
                                    <MenuItem value="">Select Village</MenuItem>
                                    {villages.map((v) => (
                                        <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="City *" InputLabelProps={{ shrink: true }} {...register("city", { required: "Required" })} error={!!errors.city} />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Bank Details Section */}
                <Typography variant="subtitle1" sx={{ color: "green", fontWeight: "bold", mb: 0.5 }}>
                    Details of separate bank account as per section 4 (2)(l)(D) of the Act
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                    Please refer to Circular No. 1558/TG RERA/2024, dated 09.09.2024
                </Typography>

                {/* Collection Account (100%) */}
                <Typography variant="subtitle2" sx={{ color: "#0288d1", fontWeight: "bold", mb: 2, mt: 3 }}>
                    Collection Account of the Project (100%)
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Bank Name *" InputLabelProps={{ shrink: true }} {...register("collectionBankName", { required: "Required" })} error={!!errors.collectionBankName} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Branch Name *" InputLabelProps={{ shrink: true }} {...register("collectionBranchName", { required: "Required" })} error={!!errors.collectionBranchName} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="IFSC Code *" InputLabelProps={{ shrink: true }} {...register("collectionIfscCode", { required: "Required" })} error={!!errors.collectionIfscCode} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Bank A/c Number *" InputLabelProps={{ shrink: true }} {...register("collectionAccountNumber", { required: "Required" })} error={!!errors.collectionAccountNumber} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField size="small" fullWidth label="Bank Address *" InputLabelProps={{ shrink: true }} {...register("collectionBankAddress", { required: "Required" })} error={!!errors.collectionBankAddress} />
                    </Grid>
                </Grid>

                {/* Separate Account (70%) */}
                <Typography variant="subtitle2" sx={{ color: "#0288d1", fontWeight: "bold", mb: 2, mt: 3 }}>
                    Separate Account of the Project (70%)
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Bank Name *" InputLabelProps={{ shrink: true }} {...register("separateBankName", { required: "Required" })} error={!!errors.separateBankName} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Branch Name *" InputLabelProps={{ shrink: true }} {...register("separateBranchName", { required: "Required" })} error={!!errors.separateBranchName} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="IFSC Code *" InputLabelProps={{ shrink: true }} {...register("separateIfscCode", { required: "Required" })} error={!!errors.separateIfscCode} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Bank A/c Number *" InputLabelProps={{ shrink: true }} {...register("separateAccountNumber", { required: "Required" })} error={!!errors.separateAccountNumber} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField size="small" fullWidth label="Bank Address *" InputLabelProps={{ shrink: true }} {...register("separateBankAddress", { required: "Required" })} error={!!errors.separateBankAddress} />
                    </Grid>
                </Grid>

                {/* Transaction Account (30%) */}
                <Typography variant="subtitle2" sx={{ color: "#0288d1", fontWeight: "bold", mb: 2, mt: 3 }}>
                    Transaction Account of the Project (30%)
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Bank Name *" InputLabelProps={{ shrink: true }} {...register("transactionBankName", { required: "Required" })} error={!!errors.transactionBankName} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Branch Name *" InputLabelProps={{ shrink: true }} {...register("transactionBranchName", { required: "Required" })} error={!!errors.transactionBranchName} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="IFSC Code *" InputLabelProps={{ shrink: true }} {...register("transactionIfscCode", { required: "Required" })} error={!!errors.transactionIfscCode} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Bank A/c Number *" InputLabelProps={{ shrink: true }} {...register("transactionAccountNumber", { required: "Required" })} error={!!errors.transactionAccountNumber} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField size="small" fullWidth label="Bank Address *" InputLabelProps={{ shrink: true }} {...register("transactionBankAddress", { required: "Required" })} error={!!errors.transactionBankAddress} />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* GIS Section */}
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Typography variant="subtitle1" sx={{ color: "green", fontWeight: "bold" }}>
                        GIS Details
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddLocationAltIcon />}
                        onClick={() => setIsMapOpen(true)}
                    >
                        Pick on Map
                    </Button>
                </Box>


                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Latitude" type="number" inputProps={{ step: "any" }} InputLabelProps={{ shrink: true }} {...register("latitude", { valueAsNumber: true })} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Longitude" type="number" inputProps={{ step: "any" }} InputLabelProps={{ shrink: true }} {...register("longitude", { valueAsNumber: true })} />
                    </Grid>
                </Grid>

                {/* Submit Buttons */}
                <Box display="flex" gap={2} sx={{ mb: 4 }}>
                    <Button type="submit" variant="contained" color="success" disabled={isSubmitting}>
                        {editingProjectId ? "Update Project" : "Save Project"}
                    </Button>
                    {editingProjectId && (
                        <Button variant="outlined" onClick={handleCancel}>
                            Cancel
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Projects List Table */}
            <Typography variant="h6" sx={{ mt: 4, mb: 2, color: "primary.main" }}>
                Project Details
            </Typography>

            {/* Location Picker Modal */}
            <LocationPicker
                open={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                onLocationSelect={(lat, lng) => {
                    setValue("latitude", lat);
                    setValue("longitude", lng);
                }}
                initialLat={watch("latitude")}
                initialLng={watch("longitude")}
            />


            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead sx={{ bgcolor: "#2e7d32" }}>
                        <TableRow>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Sr No.</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Project Name</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Sy.No/TS No.</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Boundaries East</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Boundaries West</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Boundaries North</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Boundaries South</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Total Area (In sqmts)</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Total Building Units</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">No projects added</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            projects.map((project, index) => (
                                <TableRow key={project.id} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{project.projectName}</TableCell>
                                    <TableCell>{project.landDetail?.surveyNo || "-"}</TableCell>
                                    <TableCell>{project.landDetail?.boundaryEast || "-"}</TableCell>
                                    <TableCell>{project.landDetail?.boundaryWest || "-"}</TableCell>
                                    <TableCell>{project.landDetail?.boundaryNorth || "-"}</TableCell>
                                    <TableCell>{project.landDetail?.boundarySouth || "-"}</TableCell>
                                    <TableCell>{project.landDetail?.totalAreaSqm || "-"}</TableCell>
                                    <TableCell>{project.landDetail?.approvedBuildingUnits || "-"}</TableCell>
                                    <TableCell>
                                        <Box display="flex" gap={0.5}>
                                            <Button size="small" variant="contained" color="primary" startIcon={<EditIcon />} onClick={() => handleEdit(project)}>
                                                Edit
                                            </Button>
                                            <Button size="small" variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(project.id)}>
                                                Delete
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
