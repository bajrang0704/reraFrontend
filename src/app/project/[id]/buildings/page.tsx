"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Checkbox,
    FormControlLabel,
    Card,
    CardContent,
    CardHeader,
    Alert,
    Snackbar,
    CircularProgress,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from "@mui/icons-material";
import { projectApi } from "@/lib/api/project";
import { Project, Building, ApartmentType } from "@/types/project";
import { useAuth } from "@/context/AuthContext";
import { profileApi } from "@/lib/api/profile";

// --- Validation Schema ---
const apartmentTypeSchema = z.object({
    floorNumber: z.coerce.number().min(1, "Floor number is required"),
    isUnderMortgage: z.boolean().default(false),
    apartmentType: z.string().min(1, "Type is required"),
    saleableAreaSqm: z.coerce.number().min(0, "Area must be positive"),
    proposedNumberOfUnits: z.coerce.number().min(0, "Must be positive"),
    numberOfUnitsBooked: z.coerce.number().min(0, "Must be positive"),
}).refine((data) => data.numberOfUnitsBooked <= data.proposedNumberOfUnits, {
    message: "Booked units cannot exceed proposed units",
    path: ["numberOfUnitsBooked"],
});

const buildingSchema = z.object({
    projectUuid: z.string().min(1, "Project is required"),
    buildingName: z.string().min(1, "Building Name is required"),
    proposedCompletionDate: z.string().min(1, "Completion Date is required"),
    numberOfBasements: z.coerce.number().min(0).optional().default(0),
    numberOfPodiums: z.coerce.number().min(0).optional().default(0),
    numberOfSlabsSuperStructure: z.coerce.number().min(0).optional().default(0),
    numberOfStilts: z.coerce.number().min(0).optional().default(0),
    totalParkingAreaSqm: z.coerce.number().min(0).optional().default(0),
    totalNumberOfFloors: z.coerce.number().min(1, "Total floors must be at least 1"),
    apartmentTypes: z.array(apartmentTypeSchema).optional().default([]),
});

type BuildingFormData = z.infer<typeof buildingSchema>;

const defaultValues: BuildingFormData = {
    projectUuid: "",
    buildingName: "",
    proposedCompletionDate: "",
    numberOfBasements: 0,
    numberOfPodiums: 0,
    numberOfSlabsSuperStructure: 0,
    numberOfStilts: 0,
    totalParkingAreaSqm: 0,
    totalNumberOfFloors: 0,
    apartmentTypes: [],
};

export default function BuildingDetailsPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [maxBuildings, setMaxBuildings] = useState<number>(0);
    const [currentBuildingCount, setCurrentBuildingCount] = useState<number>(0);
    const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Notification State
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const {
        register,
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors }
    } = useFormLike({
        resolver: zodResolver(buildingSchema),
        defaultValues,
    });

    // Helper to bypass strict Resolver type checking if causing issues, purely type alias
    // This resolves the "ResolverOptions" mismatch error by loosening the strict generic binding momentarily
    function useFormLike(props: any) {
        return useForm<BuildingFormData>(props);
    }

    const { fields, append, remove } = useFieldArray({
        control,
        name: "apartmentTypes",
    });

    const totalFloors = watch("totalNumberOfFloors");

    // Close Snackbar
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // 1. Fetch Projects on Load
    useEffect(() => {
        const fetchProjects = async () => {
            if (user?.loginId) {
                try {
                    setLoading(true);
                    const response = await profileApi.getProfile(user.loginId);

                    // Robust ID extraction to handle varied API responses
                    // ProfileResponse has .profile, but manual casting handles wrapper inconsistencies (data.data vs data.profile)
                    const profileObj = (response as any).data || response.profile || response;
                    const profileId = (profileObj as any)?.id;

                    if (profileId) {
                        const list = await projectApi.listProjects(profileId);
                        setProjects(list);
                    } else {
                        console.warn("Could not resolve Profile ID from response", response);
                        setSnackbar({ open: true, message: "Profile not found. Please complete profile first.", severity: "info" });
                    }
                } catch (e) {
                    console.error("Failed to fetch projects", e);
                    setSnackbar({ open: true, message: "Failed to load projects", severity: "error" });
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchProjects();
    }, [user?.loginId]);

    // 2. Handle Project Selection
    const handleProjectChange = async (projectUuid: string) => {
        if (!projectUuid) {
            setSelectedProject(null);
            setMaxBuildings(0);
            setCurrentBuildingCount(0);
            setBuildings([]);
            return;
        }

        try {
            setLoading(true);
            const response = await projectApi.getProject(projectUuid);
            const project = response.data;
            setSelectedProject(project);

            // Set Max Buildings
            const max = project.landDetail?.proposedBuildingUnits || 0;
            setMaxBuildings(max);

            // Fetch existing buildings
            const realProjectId = project.projectId || project.id;
            const list = await projectApi.listBuildings(realProjectId);
            setBuildings(list);
            setCurrentBuildingCount(list.length);

            // Reset form but keep project selected
            reset({ ...defaultValues, projectUuid });

        } catch (e) {
            console.error("Failed to fetch project details", e);
            setSnackbar({ open: true, message: "Failed to load project details", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    // 3. Handle Submit
    const onSubmit: SubmitHandler<BuildingFormData> = async (data) => {
        if (!selectedProject) return;

        // Backend Building Count Validation
        if (!editingBuildingId && currentBuildingCount >= maxBuildings) {
            setSnackbar({ open: true, message: `Cannot add more buildings. Max allowed: ${maxBuildings}`, severity: "error" });
            return;
        }

        try {
            setLoading(true);
            const apiProjectId = selectedProject.projectId || selectedProject.id;

            // Transform data for API
            // Omit projectUuid and id, ensure strict types
            const { projectUuid, ...rest } = data;
            const payload: Omit<Building, 'id' | 'projectId'> = {
                ...rest,
                // Ensure apartmentTypes is defined
                apartmentTypes: rest.apartmentTypes || []
            };

            if (editingBuildingId) {
                // Currently API only supports Create/Delete/List/Get
                await projectApi.deleteBuilding(editingBuildingId);
                await projectApi.createBuilding(apiProjectId, payload);
                setSnackbar({ open: true, message: "Building updated successfully!", severity: "success" });
            } else {
                await projectApi.createBuilding(apiProjectId, payload);
                setSnackbar({ open: true, message: "Building saved successfully!", severity: "success" });
            }

            // Refresh List
            const list = await projectApi.listBuildings(apiProjectId);
            setBuildings(list);
            setCurrentBuildingCount(list.length);
            setEditingBuildingId(null);

            // Reset Form (keep project selected)
            reset({ ...defaultValues, projectUuid: selectedProject.id });

        } catch (e: any) {
            console.error("Failed to save building", e);
            const msg = e.response?.data?.message || "Failed to save building. Please check inputs.";
            setSnackbar({ open: true, message: msg, severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this building?")) return;
        if (!selectedProject) return;

        try {
            setLoading(true);
            await projectApi.deleteBuilding(id);

            const apiProjectId = selectedProject.projectId || selectedProject.id;
            const list = await projectApi.listBuildings(apiProjectId);
            setBuildings(list);
            setCurrentBuildingCount(list.length);
            setSnackbar({ open: true, message: "Building deleted successfully", severity: "success" });
        } catch (e) {
            console.error("Failed to delete", e);
            setSnackbar({ open: true, message: "Failed to delete building", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (building: Building) => {
        setEditingBuildingId(building.id);

        // Map Building to Form Data
        const formData: BuildingFormData = {
            projectUuid: selectedProject?.id || "",
            buildingName: building.buildingName,
            proposedCompletionDate: building.proposedCompletionDate ? new Date(building.proposedCompletionDate).toISOString().split('T')[0] : "",
            numberOfBasements: building.numberOfBasements,
            numberOfPodiums: building.numberOfPodiums,
            numberOfSlabsSuperStructure: building.numberOfSlabsSuperStructure,
            numberOfStilts: building.numberOfStilts,
            totalParkingAreaSqm: building.totalParkingAreaSqm,
            totalNumberOfFloors: building.totalNumberOfFloors,
            apartmentTypes: building.apartmentTypes || []
        };

        reset(formData);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        reset({ ...defaultValues, projectUuid: selectedProject?.id || "" });
        setEditingBuildingId(null);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    Add Building Details
                </Typography>
                {loading && <CircularProgress size={24} />}
            </Box>

            {/* Project Selection */}
            <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="projectUuid"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    fullWidth
                                    label="Project Name *"
                                    error={!!errors.projectUuid}
                                    helperText={errors.projectUuid?.message}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        handleProjectChange(e.target.value);
                                    }}
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                >
                                    <MenuItem value="">Select Project</MenuItem>
                                    {projects.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>{p.projectName}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>
                    {selectedProject && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Alert severity={currentBuildingCount >= maxBuildings ? "warning" : "info"}>
                                Current Building Count: <b>{currentBuildingCount}</b> / Maximum Allowed: <b>{maxBuildings}</b>
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {selectedProject && (
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                    <Card sx={{ mb: 4 }} variant="outlined">
                        <CardHeader
                            title={editingBuildingId ? "Edit Building" : "New Building Details"}
                            titleTypographyProps={{ variant: "subtitle1", fontWeight: "bold", color: "primary" }}
                        />
                        <CardContent>
                            <Grid container spacing={3}>
                                {/* Row 1 */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth size="small"
                                        label="Name *"
                                        InputLabelProps={{ shrink: true }}
                                        {...register("buildingName")}
                                        error={!!errors.buildingName}
                                        helperText={errors.buildingName?.message}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        type="date"
                                        fullWidth size="small"
                                        label="Proposed Date of Completion *"
                                        InputLabelProps={{ shrink: true }}
                                        {...register("proposedCompletionDate")}
                                        error={!!errors.proposedCompletionDate}
                                        helperText={errors.proposedCompletionDate?.message}
                                    />
                                </Grid>

                                {/* Row 2 */}
                                <Grid size={{ xs: 6, md: 3 }}>
                                    <TextField type="number" fullWidth size="small" label="Basements" InputLabelProps={{ shrink: true }} {...register("numberOfBasements")} />
                                </Grid>
                                <Grid size={{ xs: 6, md: 3 }}>
                                    <TextField type="number" fullWidth size="small" label="Podiums" InputLabelProps={{ shrink: true }} {...register("numberOfPodiums")} />
                                </Grid>
                                <Grid size={{ xs: 6, md: 3 }}>
                                    <TextField type="number" fullWidth size="small" label="Super Structure Slabs" InputLabelProps={{ shrink: true }} {...register("numberOfSlabsSuperStructure")} />
                                </Grid>
                                <Grid size={{ xs: 6, md: 3 }}>
                                    <TextField type="number" fullWidth size="small" label="Stilts" InputLabelProps={{ shrink: true }} {...register("numberOfStilts")} />
                                </Grid>

                                {/* Row 3 */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField type="number" fullWidth size="small" label="Total Parking Area (sqm)" InputLabelProps={{ shrink: true }} {...register("totalParkingAreaSqm")} />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        type="number"
                                        fullWidth size="small"
                                        label="Total Number Of Floors *"
                                        InputLabelProps={{ shrink: true }}
                                        {...register("totalNumberOfFloors")}
                                        error={!!errors.totalNumberOfFloors}
                                        helperText={errors.totalNumberOfFloors?.message}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Apartment Type Details */}
                    <Card sx={{ mb: 4 }} variant="outlined">
                        <CardHeader
                            title="Apartment Configuration"
                            subheader="Define apartment types per floor"
                            titleTypographyProps={{ variant: "subtitle1", fontWeight: "bold", color: "primary" }}
                            action={
                                <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => append({
                                    floorNumber: 1,
                                    isUnderMortgage: false,
                                    apartmentType: "",
                                    saleableAreaSqm: 0,
                                    proposedNumberOfUnits: 0,
                                    numberOfUnitsBooked: 0
                                })}>
                                    Add Type
                                </Button>
                            }
                        />
                        <CardContent>
                            {fields.map((field, index) => (
                                <Box key={field.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, position: 'relative', bgcolor: '#fff' }}>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => remove(index)}
                                        sx={{ position: 'absolute', top: 8, right: 8 }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>

                                    <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                                        #{index + 1}
                                    </Typography>

                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <Controller
                                                name={`apartmentTypes.${index}.floorNumber`}
                                                control={control}
                                                render={({ field }) => (
                                                    <TextField
                                                        select
                                                        fullWidth
                                                        size="small"
                                                        label="Floor No *"
                                                        {...field}
                                                        value={field.value || ""}
                                                        error={!!errors.apartmentTypes?.[index]?.floorNumber}
                                                    >
                                                        {Array.from({ length: Number(totalFloors || 20) }, (_, i) => i + 1).map(num => (
                                                            <MenuItem key={num} value={num}>{num}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                )}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <TextField
                                                fullWidth size="small"
                                                label="Type (e.g. 3BHK) *"
                                                {...register(`apartmentTypes.${index}.apartmentType`)}
                                                error={!!errors.apartmentTypes?.[index]?.apartmentType}
                                                helperText={errors.apartmentTypes?.[index]?.apartmentType?.message}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <TextField
                                                type="number" fullWidth size="small"
                                                label="Saleable Area (sqm)"
                                                {...register(`apartmentTypes.${index}.saleableAreaSqm`)}
                                                error={!!errors.apartmentTypes?.[index]?.saleableAreaSqm}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <FormControlLabel
                                                control={
                                                    <Controller
                                                        name={`apartmentTypes.${index}.isUnderMortgage`}
                                                        control={control}
                                                        render={({ field }) => <Checkbox {...field} checked={field.value} size="small" />}
                                                    />
                                                }
                                                label={<Typography variant="body2">Under Mortgage?</Typography>}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                type="number" fullWidth size="small"
                                                label="Proposed Units"
                                                {...register(`apartmentTypes.${index}.proposedNumberOfUnits`)}
                                                error={!!errors.apartmentTypes?.[index]?.proposedNumberOfUnits}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                type="number" fullWidth size="small"
                                                label="Booked/Sold Units"
                                                {...register(`apartmentTypes.${index}.numberOfUnitsBooked`)}
                                                error={!!errors.apartmentTypes?.[index]?.numberOfUnitsBooked}
                                                helperText={errors.apartmentTypes?.[index]?.numberOfUnitsBooked?.message}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                            {fields.length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f9fafb', borderRadius: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No apartment types added yet. Click "Add Type" to configure units.
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
                        <Button type="submit" variant="contained" color="primary" disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}>
                            {editingBuildingId ? "Save Changes" : "Save Building"}
                        </Button>
                        <Button variant="outlined" onClick={handleCancel} disabled={loading}>
                            Cancel
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Buildings Table */}
            {selectedProject && (
                <TableContainer component={Paper} elevation={1}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Structure (B/P/S/St)</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Floors</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Parking (sqm)</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Completion</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {buildings.map((b, index) => (
                                <TableRow key={b.id} hover>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{b.buildingName}</TableCell>
                                    <TableCell>{`${b.numberOfBasements}B + ${b.numberOfPodiums}P + ${b.numberOfSlabsSuperStructure}S + ${b.numberOfStilts}St`}</TableCell>
                                    <TableCell>{b.totalNumberOfFloors}</TableCell>
                                    <TableCell>{b.totalParkingAreaSqm}</TableCell>
                                    <TableCell>{b.proposedCompletionDate ? new Date(b.proposedCompletionDate).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => handleEdit(b)} color="primary"><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(b.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {buildings.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No buildings added yet.
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
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
