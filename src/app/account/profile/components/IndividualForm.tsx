"use client";

import { UseFormReturn, Controller } from "react-hook-form";
import { District, Mandal, Village } from "@/types/profile";
import {
    Box,
    Button,
    FormControlLabel,
    Grid,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography,
    CircularProgress // Added
} from "@mui/material";
import { useState } from "react"; // Added
import { useAuth } from "@/context/AuthContext"; // Added
import { profileApi } from "@/lib/api/profile"; // Added
import { IndividualFormData, PAN_REGEX, AADHAR_REGEX, MOBILE_REGEX } from "../types";
import AddressSection from "./AddressSection";

interface IndividualFormProps {
    form: UseFormReturn<IndividualFormData>;
    districts: District[];
    mandals: Mandal[];
    villages: Village[];
    onDistrictChange: (districtId: string, form: any) => void;
    onMandalChange: (mandalId: string, form: any) => void;
    onSubmit: (data: IndividualFormData) => void;
    saving: boolean;
}

export default function IndividualForm({
    form,
    districts,
    mandals,
    villages,
    onDistrictChange,
    onMandalChange,
    onSubmit,
    saving
}: IndividualFormProps) {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user?.projectId) {
            const file = e.target.files[0];
            setUploading(true);
            try {
                const { url } = await profileApi.uploadProfileImage(user.projectId, file);
                form.setValue("imageUrl", url, { shouldValidate: true, shouldDirty: true });
            } catch (error) {
                console.error("Failed to upload image", error);
                alert("Failed to upload image");
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Individual Details */}
            <Paper sx={{ mb: 4, p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Individual Details</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="First Name (Surname)"
                            required
                            {...form.register("firstName", { required: "First name is required" })}
                            error={!!form.formState.errors.firstName}
                            helperText={form.formState.errors.firstName?.message}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Middle Name"
                            {...form.register("middleName")}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Last Name"
                            required
                            {...form.register("lastName", { required: "Last name is required" })}
                            error={!!form.formState.errors.lastName}
                            helperText={form.formState.errors.lastName?.message}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="PAN Number"
                            placeholder="ABCDE1234F"
                            required
                            {...form.register("panNumber", {
                                required: "PAN code is required",
                                pattern: { value: PAN_REGEX, message: "Invalid PAN format" }
                            })}
                            error={!!form.formState.errors.panNumber}
                            helperText={form.formState.errors.panNumber?.message}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Aadhar Number"
                            required
                            {...form.register("aadharNumber", {
                                required: "Aadhar is required",
                                pattern: { value: AADHAR_REGEX, message: "Must be 12 digits" }
                            })}
                            error={!!form.formState.errors.aadharNumber}
                            helperText={form.formState.errors.aadharNumber?.message}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Father's Full Name"
                            required
                            {...form.register("fatherFullName", { required: "Required" })}
                            error={!!form.formState.errors.fatherFullName}
                            helperText={form.formState.errors.fatherFullName?.message}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Do you have Past Experience? <span style={{ color: "red" }}>*</span>
                        </Typography>
                        <Controller
                            name="hasPastExperience"
                            control={form.control}
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                                <RadioGroup row {...field} value={field.value ? "YES" : "NO"} onChange={(e) => field.onChange(e.target.value === "YES")}>
                                    <FormControlLabel value="YES" control={<Radio />} label="Yes" />
                                    <FormControlLabel value="NO" control={<Radio />} label="No" />
                                </RadioGroup>
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Do you have GST Number? <span style={{ color: "red" }}>*</span>
                        </Typography>
                        <Controller
                            name="hasGst"
                            control={form.control}
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                                <RadioGroup row {...field} value={field.value ? "YES" : "NO"} onChange={(e) => field.onChange(e.target.value === "YES")}>
                                    <FormControlLabel value="YES" control={<Radio />} label="Yes" />
                                    <FormControlLabel value="NO" control={<Radio />} label="No" />
                                </RadioGroup>
                            )}
                        />
                    </Grid>
                    {form.watch("hasGst") && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="GST Number"
                                required
                                {...form.register("gstNumber", { required: "GST is required" })}
                                error={!!form.formState.errors.gstNumber}
                            />
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Address Section */}
            <AddressSection
                form={form}
                districts={districts}
                mandals={mandals}
                villages={villages}
                onDistrictChange={onDistrictChange}
                onMandalChange={onMandalChange}
            />

            {/* Contact Details */}
            <Paper sx={{ mb: 4, p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Contact Details</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Mobile Number"
                            required
                            {...form.register("mobileNumber", {
                                required: "Required",
                                pattern: { value: MOBILE_REGEX, message: "Invalid Mobile" }
                            })}
                            error={!!form.formState.errors.mobileNumber}
                            helperText={form.formState.errors.mobileNumber?.message}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Email Address"
                            required
                            {...form.register("emailId", {
                                required: "Required",
                                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
                            })}
                            error={!!form.formState.errors.emailId}
                            helperText={form.formState.errors.emailId?.message}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Office Number"
                            required
                            {...form.register("officeNumber", { required: "Required" })}
                            error={!!form.formState.errors.officeNumber}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Fax Number" {...form.register("faxNumber")} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField size="small" fullWidth label="Website URL" {...form.register("websiteUrl")} />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" gutterBottom>Profile Photo</Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                            {form.watch("imageUrl") && (
                                <Box
                                    component="img"
                                    src={form.watch("imageUrl")}
                                    alt="Profile"
                                    sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1 }}
                                />
                            )}
                            <Button
                                variant="outlined"
                                component="label"
                                disabled={uploading}
                            >
                                {uploading ? <CircularProgress size={24} /> : "Upload Photo"}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Box display="flex" justifyContent="flex-end">
                <Button variant="contained" type="submit" size="large" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                </Button>
            </Box>
        </form>
    );
}
