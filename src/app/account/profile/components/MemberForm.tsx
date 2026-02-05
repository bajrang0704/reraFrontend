"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { District, Mandal, Village, OrgMember, Designation } from "@/types/profile";
import {
    Box,
    Button,
    Grid,
    MenuItem,
    Paper,
    TextField,
    Typography,
    Avatar,
    CircularProgress
} from "@mui/material";
import { PAN_REGEX, AADHAR_REGEX, PINCODE_REGEX } from "../types";
import { profileApi } from "@/lib/api/profile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface MemberFormProps {
    onSave: (member: OrgMember) => void;
    onCancel: () => void;
    initialData?: OrgMember | null;
    districts: District[];
    designations: Designation[];
}

const emptyMember: OrgMember = {
    designationCode: "",
    firstName: "",
    middleName: "",
    lastName: "",
    panNumber: "",
    aadhaarNumber: "",
    houseNumber: "",
    buildingName: "",
    streetName: "",
    locality: "",
    landmark: "",
    state: "Telangana",
    district: "",
    mandal: "",
    village: "",
    pinCode: "",
    imageUrl: ""
};

export default function MemberForm({ onSave, onCancel, initialData, districts, designations }: MemberFormProps) {
    console.log("MemberForm received designations:", designations);
    const [mandals, setMandals] = useState<Mandal[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);
    const [uploading, setUploading] = useState(false);

    const form = useForm<OrgMember>({
        defaultValues: initialData || emptyMember
    });

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            form.reset(initialData);
            if (initialData.district) {
                profileApi.getMandals(initialData.district).then(setMandals);
                if (initialData.mandal) {
                    profileApi.getVillages(initialData.mandal).then(setVillages);
                }
            }
        } else {
            form.reset(emptyMember);
            setMandals([]);
            setVillages([]);
        }
    }, [initialData, form]);

    const handleDistrictChange = async (districtId: string) => {
        form.setValue("mandal", "");
        form.setValue("village", "");
        setVillages([]);
        if (districtId) {
            const res = await profileApi.getMandals(districtId);
            setMandals(res);
        } else {
            setMandals([]);
        }
    };

    const handleMandalChange = async (mandalId: string) => {
        form.setValue("village", "");
        if (mandalId) {
            const res = await profileApi.getVillages(mandalId);
            setVillages(res);
        } else {
            setVillages([]);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const response = await profileApi.uploadProfileImage("temp", file);
            form.setValue("imageUrl", response.url);
        } catch (error) {
            console.error(error);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = (data: OrgMember) => {
        onSave(data);
        if (!initialData) {
            form.reset(emptyMember);
            setMandals([]);
            setVillages([]);
        }
    };

    return (
        <Paper sx={{ mb: 4, p: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
                {initialData ? "Edit Partner/Member Details" : "Add Partner/Member Details"}
            </Typography>

            <Grid container spacing={3}>
                {/* Designation Dropdown */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="designationCode"
                        control={form.control}
                        rules={{ required: "Required" }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                fullWidth
                                size="small"
                                label="Designation"
                                required
                                error={!!form.formState.errors.designationCode}
                            >
                                {designations.map((d) => (
                                    <MenuItem key={d.code} value={d.code}>
                                        {d.label} {d.isMandatory && "*"}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                </Grid>

                {/* Name Fields */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="First Name"
                        required
                        {...form.register("firstName", { required: "Required" })}
                        error={!!form.formState.errors.firstName}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="Middle Name"
                        {...form.register("middleName")}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="Last Name"
                        required
                        {...form.register("lastName", { required: "Required" })}
                        error={!!form.formState.errors.lastName}
                    />
                </Grid>

                {/* PAN & Aadhaar */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="PAN Number"
                        required
                        {...form.register("panNumber", {
                            required: "Required",
                            pattern: { value: PAN_REGEX, message: "Invalid PAN" }
                        })}
                        error={!!form.formState.errors.panNumber}
                        helperText={form.formState.errors.panNumber?.message}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="Aadhaar Number"
                        required
                        {...form.register("aadhaarNumber", {
                            required: "Required",
                            pattern: { value: AADHAR_REGEX, message: "Invalid Aadhaar" }
                        })}
                        error={!!form.formState.errors.aadhaarNumber}
                        helperText={form.formState.errors.aadhaarNumber?.message}
                    />
                </Grid>
            </Grid>

            {/* Address Section (Flat fields) */}
            <Paper sx={{ mt: 3, p: 2 }} variant="outlined">
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Partner Address Details</Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="House Number"
                            required
                            {...form.register("houseNumber", { required: "Required" })}
                            error={!!form.formState.errors.houseNumber}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Building Name"
                            required
                            {...form.register("buildingName", { required: "Required" })}
                            error={!!form.formState.errors.buildingName}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Street Name"
                            required
                            {...form.register("streetName", { required: "Required" })}
                            error={!!form.formState.errors.streetName}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Locality"
                            required
                            {...form.register("locality", { required: "Required" })}
                            error={!!form.formState.errors.locality}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Landmark"
                            required
                            {...form.register("landmark", { required: "Required" })}
                            error={!!form.formState.errors.landmark}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField size="small" fullWidth label="State" value="Telangana" disabled {...form.register("state")} />
                    </Grid>

                    {/* District */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="district"
                            control={form.control}
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    size="small"
                                    select
                                    fullWidth
                                    label="District"
                                    required
                                    error={!!form.formState.errors.district}
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

                    {/* Mandal */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="mandal"
                            control={form.control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    size="small"
                                    select
                                    fullWidth
                                    label="Mandal"
                                    disabled={!form.watch("district")}
                                    error={!!form.formState.errors.mandal}
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

                    {/* Village */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Controller
                            name="village"
                            control={form.control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    size="small"
                                    select
                                    fullWidth
                                    label="Village/City/Town"
                                    disabled={!form.watch("mandal")}
                                    error={!!form.formState.errors.village}
                                >
                                    {villages.map((v) => (
                                        <MenuItem key={v.code} value={v.code}>{v.name}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>

                    {/* Pin Code */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Pin Code"
                            required
                            {...form.register("pinCode", {
                                required: "Required",
                                pattern: { value: PINCODE_REGEX, message: "Invalid Pin Code" }
                            })}
                            error={!!form.formState.errors.pinCode}
                            helperText={form.formState.errors.pinCode?.message}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Image Upload */}
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} my={3}>
                <Typography variant="subtitle2">Upload Profile Photo</Typography>
                {form.watch("imageUrl") ? (
                    <Avatar src={form.watch("imageUrl")} sx={{ width: 80, height: 80 }} />
                ) : (
                    <Box sx={{ width: 80, height: 80, bgcolor: "grey.100", borderRadius: "50%" }} />
                )}
                <Button
                    component="label"
                    variant="outlined"
                    startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    disabled={uploading}
                >
                    {uploading ? "Uploading..." : "Upload Photo"}
                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </Button>
            </Box>

            <Box display="flex" justifyContent="flex-end" gap={2}>
                {initialData && (
                    <Button onClick={onCancel}>Cancel</Button>
                )}
                <Button variant="contained" onClick={form.handleSubmit(onSubmit)}>
                    {initialData ? "Update Member" : "Add New Member"}
                </Button>
            </Box>
        </Paper>
    );
}
