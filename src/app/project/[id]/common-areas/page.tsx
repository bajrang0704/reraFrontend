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
    Divider,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { projectApi } from "@/lib/api/project";
import { Project, Facility, CommonAreaSummary, FacilityScope } from "@/types/project";
import { useAuth } from "@/context/AuthContext";
import { profileApi } from "@/lib/api/profile";

// --- Validation Schema ---

const facilitySchema = z.object({
    facilityId: z.string().optional(),
    masterId: z.string().optional(),
    code: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    scope: z.enum(['SYSTEM', 'PROJECT_CUSTOM'] as const),
    proposed: z.boolean().default(false),
    percentageOfCompletion: z.coerce.number().min(0).max(100).default(0),
    details: z.string().optional().default(""),
});

const commonAreaSchema = z.object({
    projectUuid: z.string().min(1, "Project is required"),

    // Parking
    openParkingAreaSqm: z.coerce.number().min(0).default(0),
    coveredParkingCount: z.coerce.number().min(0).default(0),
    openParkingUnitsBooked: z.coerce.number().min(0).default(0),
    coveredParkingUnitsBooked: z.coerce.number().min(0).default(0),
    openParkingProgressPercent: z.coerce.number().min(0).max(100).default(0),
    coveredParkingProgressPercent: z.coerce.number().min(0).max(100).default(0),

    // Facilities
    facilities: z.array(facilitySchema).default([]),
});

type CommonAreaFormData = z.infer<typeof commonAreaSchema>;

const defaultValues: CommonAreaFormData = {
    projectUuid: "",
    openParkingAreaSqm: 0,
    coveredParkingCount: 0,
    openParkingUnitsBooked: 0,
    coveredParkingUnitsBooked: 0,
    openParkingProgressPercent: 0,
    coveredParkingProgressPercent: 0,
    facilities: [],
};

// Standard List of Facilities if not returned from backend (Fallback/Init)
// In a real scenario, we might want to fetch this list from a "Master Data" API.
// For now, we will handle them dynamically from the GET response or defaults.

export default function CommonAreasPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
        setValue,
        formState: { errors }
    } = useForm<CommonAreaFormData>({
        resolver: zodResolver(commonAreaSchema),
        defaultValues,
    });

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "facilities",
    });

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

                    const profileObj = (response as any).data || response.profile || response;
                    const profileId = (profileObj as any)?.id;

                    if (profileId) {
                        const list = await projectApi.listProjects(profileId);
                        setProjects(list);
                    } else {
                        setSnackbar({ open: true, message: "Profile failed to load.", severity: "info" });
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

    // 2. Handle Project Change -> Fetch Common Areas
    const handleProjectChange = async (projectUuid: string) => {
        if (!projectUuid) {
            setSelectedProject(null);
            reset(defaultValues);
            return;
        }

        try {
            setLoading(true);
            const response = await projectApi.getProject(projectUuid);
            const project = response.data;
            setSelectedProject(project);

            // Fetch Common Areas
            const apiProjectId = project.projectId || project.id;
            const commonAreasData = await projectApi.getCommonAreas(apiProjectId);

            // Merge Data into Form
            if (commonAreasData && commonAreasData.data) {
                const summary = commonAreasData.data.summary || {};
                const facilities = commonAreasData.data.facilities || [];

                reset({
                    projectUuid,
                    openParkingAreaSqm: summary.openParkingAreaSqm || 0,
                    coveredParkingCount: summary.coveredParkingCount || 0,
                    openParkingUnitsBooked: summary.openParkingUnitsBooked || 0,
                    coveredParkingUnitsBooked: summary.coveredParkingUnitsBooked || 0,
                    openParkingProgressPercent: summary.openParkingProgressPercent || 0,
                    coveredParkingProgressPercent: summary.coveredParkingProgressPercent || 0,
                    facilities: facilities.length > 0 ? facilities : [
                        // If empty, we could initialize with defaults if we had a hardcoded list,
                        // but ideally the backend should return the template list even if empty.
                        // We will rely on "Add Custom" for now if empty, or assume backend 
                        // pre-populates the "System" ones on creation.
                    ]
                });

                // If the backend returns empty facilities, we might want to populate standard ones manually?
                // Let's rely on what the API returns. The prompt implies the GET returns consolidated list handling defaults.
                if (facilities.length > 0) {
                    replace(facilities);
                }
            } else {
                // Reset to defaults but keep project
                reset({ ...defaultValues, projectUuid });
            }

        } catch (e) {
            console.error("Failed to fetch data", e);
            setSnackbar({ open: true, message: "Failed to load common areas data", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    // 3. Handle Submit
    const onSubmit: SubmitHandler<CommonAreaFormData> = async (data) => {
        if (!selectedProject) return;

        try {
            setLoading(true);
            const apiProjectId = selectedProject.projectId || selectedProject.id;

            // Transform form data to match API expectation
            // The API expects { ...summary, facilities: [...] } structure roughly based on doc
            // But the sample Request payload in doc is flat + facilities array.

            const payload = {
                openParkingAreaSqm: data.openParkingAreaSqm,
                coveredParkingCount: data.coveredParkingCount,
                openParkingUnitsBooked: data.openParkingUnitsBooked,
                coveredParkingUnitsBooked: data.coveredParkingUnitsBooked,
                openParkingProgressPercent: data.openParkingProgressPercent,
                coveredParkingProgressPercent: data.coveredParkingProgressPercent,
                facilities: data.facilities
            };

            await projectApi.saveCommonAreas(apiProjectId, payload);
            setSnackbar({ open: true, message: "Common Areas details saved successfully!", severity: "success" });

            // Refresh data to get generated IDs if any
            const refreshedData = await projectApi.getCommonAreas(apiProjectId);
            if (refreshedData?.data?.facilities) {
                replace(refreshedData.data.facilities);
            }

        } catch (e: any) {
            console.error("Failed to save", e);
            const msg = e.response?.data?.message || "Failed to save details.";
            setSnackbar({ open: true, message: msg, severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomFacility = () => {
        append({
            name: "",
            scope: "PROJECT_CUSTOM",
            proposed: false,
            percentageOfCompletion: 0,
            details: ""
        });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    Common Areas & Facilities
                </Typography>
                {loading && <CircularProgress size={24} />}
            </Box>

            {/* Project Selection */}
            <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
                <Controller
                    name="projectUuid"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            fullWidth
                            label="Project Name *"
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
            </Paper>

            {selectedProject && (
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>

                    {/* Parking Details Section */}
                    <Card sx={{ mb: 4 }} variant="outlined">
                        <CardHeader
                            title="Project Details (Parking)"
                            titleTypographyProps={{ variant: "subtitle1", fontWeight: "bold", bgcolor: "#e0f2f1", color: "#00695c", p: 1 }}
                            sx={{ p: 0 }}
                        />
                        <CardContent>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: "#00838f" }}>
                                        <TableRow>
                                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Proposed (Value)</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Number Of Units Booked</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold" }}>Progress Of Work Done (in %)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Open Parking (in sqmts)</TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number" fullWidth size="small"
                                                    {...register("openParkingAreaSqm")}
                                                    InputProps={{ inputProps: { min: 0 } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number" fullWidth size="small"
                                                    {...register("openParkingUnitsBooked")}
                                                    InputProps={{ inputProps: { min: 0 } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number" fullWidth size="small"
                                                    {...register("openParkingProgressPercent")}
                                                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Covered Parking (in Numbers)</TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number" fullWidth size="small"
                                                    {...register("coveredParkingCount")}
                                                    InputProps={{ inputProps: { min: 0 } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number" fullWidth size="small"
                                                    {...register("coveredParkingUnitsBooked")}
                                                    InputProps={{ inputProps: { min: 0 } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    type="number" fullWidth size="small"
                                                    {...register("coveredParkingProgressPercent")}
                                                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Development Work (Facilities) Section */}
                    <Card sx={{ mb: 4 }} variant="outlined">
                        <CardHeader
                            title="Development Work"
                            titleTypographyProps={{ variant: "subtitle1", fontWeight: "bold", color: "#2e7d32" }}
                        />
                        <CardContent>
                            <Typography variant="subtitle2" sx={{ bgcolor: "#5499c7", color: "white", p: 1, mb: 2 }}>
                                Common areas And Facilities, Amenities
                            </Typography>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: "#5499c7" }}>
                                        <TableRow>
                                            <TableCell sx={{ color: "white", fontWeight: "bold", width: "30%" }}>Common areas And Facilities, Amenities</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold", width: "15%" }}>Proposed</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold", width: "15%" }}>Percentage Of Completion</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold", width: "35%" }}>Details</TableCell>
                                            <TableCell sx={{ color: "white", fontWeight: "bold", width: "5%" }}></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {fields.map((field, index) => (
                                            <TableRow key={field.id} hover>
                                                <TableCell>
                                                    {field.scope === 'SYSTEM' ? (
                                                        <Typography variant="body2">{field.name}</Typography>
                                                    ) : (
                                                        <TextField
                                                            fullWidth size="small" placeholder="Enter Facility Name"
                                                            {...register(`facilities.${index}.name`)}
                                                            error={!!errors.facilities?.[index]?.name}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Controller
                                                        name={`facilities.${index}.proposed`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <TextField {...field} select fullWidth size="small" value={field.value ? "Yes" : "No"} onChange={(e) => field.onChange(e.target.value === "Yes")}>
                                                                <MenuItem value="Yes">Yes</MenuItem>
                                                                <MenuItem value="No">No</MenuItem>
                                                            </TextField>
                                                        )}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        type="number" fullWidth size="small"
                                                        {...register(`facilities.${index}.percentageOfCompletion`)}
                                                        InputProps={{ inputProps: { min: 0, max: 100 } }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        fullWidth size="small"
                                                        {...register(`facilities.${index}.details`)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {field.scope === 'PROJECT_CUSTOM' && (
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => remove(index)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Add More Button Row */}
                            <Box sx={{ bgcolor: "#37474f", color: "white", p: 1, mt: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleAddCustomFacility}>
                                <Button startIcon={<AddIcon />} sx={{ color: "white", fontWeight: "bold", textTransform: "none" }}>
                                    Add More Common Areas and facilities
                                </Button>
                            </Box>

                        </CardContent>
                    </Card>

                    <Button type="submit" variant="contained" color="success" size="large" disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}>
                        Save
                    </Button>
                    <Typography variant="caption" color="error" sx={{ ml: 2, fontWeight: "bold" }}>
                        After any add or update of data, click on save button.
                    </Typography>

                </Box>
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
