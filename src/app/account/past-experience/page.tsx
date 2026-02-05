"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { profileApi } from "@/lib/api/profile";
import { PastExperience, ProjectType } from "@/types/profile";
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText
} from "@mui/material";
import { useRouter } from "next/navigation";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "PLOTTED_DEVELOPMENT", label: "Plotted Development" },
    { value: "MIXED_DEVELOPMENT", label: "Mixed Development" },
];

interface PastExperienceFormData {
    projectName: string;
    projectType: ProjectType;
    surveyOrPlotNo: string;
    projectAddress: string;
    landAreaSqMtrs: number;
    numberOfBuildingsPlotsBlocks: number;
    numberOfApartments: number;
    totalCostInInr: number;
    originalProposedCompletionDate: string;
    actualCompletionDate: string;
}

const emptyForm: PastExperienceFormData = {
    projectName: "",
    projectType: "RESIDENTIAL",
    surveyOrPlotNo: "",
    projectAddress: "",
    landAreaSqMtrs: 0,
    numberOfBuildingsPlotsBlocks: 0,
    numberOfApartments: 0,
    totalCostInInr: 0,
    originalProposedCompletionDate: "",
    actualCompletionDate: "",
};

export default function PastExperiencePage() {
    const { user } = useAuth();
    const [experiences, setExperiences] = useState<PastExperience[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [showGateDialog, setShowGateDialog] = useState(false);
    const router = useRouter(); // You'll need to import useRouter from next/navigation

    const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<PastExperienceFormData>({
        defaultValues: emptyForm
    });

    const projectType = watch("projectType");

    useEffect(() => {
        if (user?.projectId) {
            checkProfileAndLoad();
        }
    }, [user?.projectId]);

    const checkProfileAndLoad = async () => {
        if (!user?.projectId) return;
        try {
            // Check Profile First
            const profileData = await profileApi.getProfile(user.projectId);
            const p = (profileData as any).data || profileData.profile;

            let hasExperience = false;

            if (p) {
                // Handle nested structure if necessary, or flat structure
                // Logic based on recent observations of profile data structure
                if (p.organizationDetails) {
                    hasExperience = p.organizationDetails.hasPastExperience;
                } else if (p.individualDetails) {
                    hasExperience = p.individualDetails.hasPastExperience;
                } else {
                    // Fallback for flat structure
                    hasExperience = p.hasPastExperience;
                }
            }

            if (!hasExperience) {
                setShowGateDialog(true);
                setLoading(false);
                return;
            }

            // If has experience, load data
            loadExperiences();
        } catch (error) {
            console.error("Failed to load profile/experiences", error);
            setLoading(false);
        }
    };

    const loadExperiences = async () => {
        if (!user?.projectId) return;
        try {
            const data = await profileApi.getPastExperiences(user.projectId);
            setExperiences(data);
        } catch (error: any) {
            console.error("Failed to load past experiences", error);
            if (error.response?.status === 403) {
                setError("Past Experience is not enabled for this profile. Please enable 'Has Past Experience' in your profile first.");
            }
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: PastExperienceFormData) => {
        if (!user?.projectId) return;
        setError(null);
        try {
            if (editingId) {
                await profileApi.updatePastExperience(user.projectId, editingId, data);
            } else {
                await profileApi.addPastExperience(user.projectId, data);
            }
            reset(emptyForm);
            setEditingId(null);
            loadExperiences();
            alert("Experience saved successfully!");
        } catch (error: any) {
            console.error("Failed to save", error);
            if (error.response?.status === 403) {
                setError("Operation Denied: You have indicated 'No Past Experience' in your Profile. Please go to 'My Profile' and set 'Do you have Past Experience?' to 'Yes' to add details.");
                window.scrollTo(0, 0);
            } else {
                setError(error.response?.data?.message || "Failed to save experience");
            }
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
        reset({
            projectName: exp.projectName,
            projectType: exp.projectType,
            surveyOrPlotNo: exp.surveyOrPlotNo,
            projectAddress: exp.projectAddress,
            landAreaSqMtrs: exp.landAreaSqMtrs,
            numberOfBuildingsPlotsBlocks: exp.numberOfBuildingsPlotsBlocks,
            numberOfApartments: exp.numberOfApartments,
            totalCostInInr: exp.totalCostInInr,
            originalProposedCompletionDate: exp.originalProposedCompletionDate,
            actualCompletionDate: exp.actualCompletionDate,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        reset(emptyForm);
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
            <Dialog
                open={showGateDialog}
                disableEscapeKeyDown
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Past Experience Required"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        You have not indicated that you have past experience in your profile.
                        Please enable "Has Past Experience" in your profile to add project details here.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => router.push(user?.projectId ? `/project/${encodeURIComponent(user.projectId)}/status` : '/dashboard')}>Cancel</Button>
                    <Button onClick={() => router.push('/account/profile')} variant="contained" autoFocus>
                        Go to Profile
                    </Button>
                </DialogActions>
            </Dialog>
            <Typography variant="h5" sx={{ mb: 1, borderBottom: '2px solid #ccc', pb: 1 }}>
                Past Experience Details
            </Typography>

            <Typography variant="body2" sx={{ color: 'error.main', mb: 2 }}>
                All * Mark field are mandatory.
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Typography variant="subtitle1" sx={{ color: 'green', fontWeight: 'bold', mb: 2 }}>
                Brief Details of Project launched and completed by promoter in last five years:(across India)
            </Typography>

            {/* Form Section */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 4 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Project Name"
                            required
                            {...register("projectName", { required: "Required" })}
                            error={!!errors.projectName}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="projectType"
                            control={control}
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    size="small"
                                    select
                                    fullWidth
                                    label="Project Type"
                                    required
                                    error={!!errors.projectType}
                                >
                                    <MenuItem value="" disabled>Select Project Type</MenuItem>
                                    {PROJECT_TYPES.map(type => (
                                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Address"
                            required
                            {...register("projectAddress", { required: "Required" })}
                            error={!!errors.projectAddress}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Land Area(In Sq mtrs)"
                            type="number"
                            required
                            {...register("landAreaSqMtrs", { required: "Required", valueAsNumber: true, min: { value: 0.01, message: "Must be > 0" } })}
                            error={!!errors.landAreaSqMtrs}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Number of Buildings/Plots/Blocks"
                            type="number"
                            required
                            {...register("numberOfBuildingsPlotsBlocks", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Must be > 0" } })}
                            error={!!errors.numberOfBuildingsPlotsBlocks}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Number of Apartments"
                            type="number"
                            required={projectType !== "PLOTTED_DEVELOPMENT"}
                            disabled={projectType === "PLOTTED_DEVELOPMENT"}
                            {...register("numberOfApartments", {
                                valueAsNumber: true,
                                validate: (value) => {
                                    if (projectType === "PLOTTED_DEVELOPMENT" && value !== 0) {
                                        return "Must be 0 for Plotted Development";
                                    }
                                    if (projectType !== "PLOTTED_DEVELOPMENT" && value <= 0) {
                                        return "Must be > 0 for this project type";
                                    }
                                    return true;
                                }
                            })}
                            error={!!errors.numberOfApartments}
                            helperText={projectType === "PLOTTED_DEVELOPMENT" ? "Not applicable for Plotted Development" : ""}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Total Cost(In INR)"
                            type="number"
                            required
                            {...register("totalCostInInr", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Must be > 0" } })}
                            error={!!errors.totalCostInInr}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Survey No./Plot No."
                            required
                            {...register("surveyOrPlotNo", { required: "Required" })}
                            error={!!errors.surveyOrPlotNo}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Original Proposed Date of Completion"
                            type="date"
                            required
                            InputLabelProps={{ shrink: true }}
                            {...register("originalProposedCompletionDate", { required: "Required" })}
                            error={!!errors.originalProposedCompletionDate}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Actual Completion Date"
                            type="date"
                            required
                            InputLabelProps={{ shrink: true }}
                            {...register("actualCompletionDate", {
                                required: "Required",
                                validate: (value) => {
                                    const proposed = watch("originalProposedCompletionDate");
                                    if (proposed && value < proposed) {
                                        return "Actual date must be >= Proposed date";
                                    }
                                    return true;
                                }
                            })}
                            error={!!errors.actualCompletionDate}
                            helperText={errors.actualCompletionDate?.message}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Box display="flex" gap={1}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="success"
                                disabled={isSubmitting}
                            >
                                {editingId ? "Update Experience" : "Save Experience"}
                            </Button>
                            {editingId && (
                                <Button variant="outlined" onClick={handleCancel}>
                                    Cancel
                                </Button>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Table Section */}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#2e7d32' }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Srno</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Project Name</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type of Project</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Others</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Land Area(In Sq mtrs)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Address</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total Cost</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>CTS Number</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Number of Buildings/Plot</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Number of Apartments</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Original Proposed Date of Completion</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actual Completion Date</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Edit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {experiences.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
                                    <Typography color="textSecondary">No past experiences added</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            experiences.map((exp, index) => (
                                <TableRow key={exp.id} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{exp.projectName}</TableCell>
                                    <TableCell>{PROJECT_TYPES.find(t => t.value === exp.projectType)?.label || exp.projectType}</TableCell>
                                    <TableCell>NA</TableCell>
                                    <TableCell>{exp.landAreaSqMtrs}</TableCell>
                                    <TableCell>{exp.projectAddress}</TableCell>
                                    <TableCell>{exp.totalCostInInr}</TableCell>
                                    <TableCell>{exp.surveyOrPlotNo}</TableCell>
                                    <TableCell>{exp.numberOfBuildingsPlotsBlocks}</TableCell>
                                    <TableCell>{exp.numberOfApartments}</TableCell>
                                    <TableCell>{exp.originalProposedCompletionDate}</TableCell>
                                    <TableCell>{exp.actualCompletionDate}</TableCell>
                                    <TableCell>
                                        <Box display="flex" gap={0.5}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                startIcon={<EditIcon />}
                                                onClick={() => handleEdit(exp)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDelete(exp.id)}
                                            >
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
