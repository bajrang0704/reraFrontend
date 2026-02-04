"use client";

import { UseFormReturn, Controller } from "react-hook-form";
import { District, Mandal, Village } from "@/types/profile";
import {
    Box,
    Button,
    FormControlLabel,
    Grid,
    MenuItem,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography
} from "@mui/material";
import { OrganizationFormData, PAN_REGEX, MOBILE_REGEX, ORGANIZATION_TYPES } from "../types";
import AddressSection from "./AddressSection";

interface OrganizationFormProps {
    form: UseFormReturn<OrganizationFormData>;
    districts: District[];
    mandals: Mandal[];
    villages: Village[];
    onDistrictChange: (districtId: string, form: any) => void;
    onMandalChange: (mandalId: string, form: any) => void;
    onSubmit: (data: OrganizationFormData) => void;
    saving: boolean;
}

export default function OrganizationForm({
    form,
    districts,
    mandals,
    villages,
    onDistrictChange,
    onMandalChange,
    onSubmit,
    saving
}: OrganizationFormProps) {
    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Organization Details */}
            <Paper sx={{ mb: 4, p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Organization Details</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="organizationType"
                            control={form.control}
                            rules={{ required: "Required" }}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    value={field.value || ""}
                                    size="small"
                                    select
                                    fullWidth
                                    label="Organization Type"
                                    error={!!form.formState.errors.organizationType}
                                >
                                    {ORGANIZATION_TYPES.map(type => (
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
                            label="Organization Name"
                            {...form.register("organizationName", { required: "Required" })}
                            error={!!form.formState.errors.organizationName}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="PAN Number"
                            {...form.register("panNumber", {
                                required: "Required",
                                pattern: { value: PAN_REGEX, message: "Invalid PAN" }
                            })}
                            error={!!form.formState.errors.panNumber}
                            helperText={form.formState.errors.panNumber?.message}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" gutterBottom>Do you have Past Experience?</Typography>
                        <Controller
                            name="hasPastExperience"
                            control={form.control}
                            render={({ field }) => (
                                <RadioGroup row {...field} value={field.value ? "YES" : "NO"} onChange={(e) => field.onChange(e.target.value === "YES")}>
                                    <FormControlLabel value="YES" control={<Radio />} label="Yes" />
                                    <FormControlLabel value="NO" control={<Radio />} label="No" />
                                </RadioGroup>
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" gutterBottom>Do you have GST Number?</Typography>
                        <Controller
                            name="hasGst"
                            control={form.control}
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
                title="Address Details"
            />

            {/* Organization Contact Details */}
            <Paper sx={{ mb: 4, p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Organization Contact Details</Typography>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Name of Contact Person"
                            {...form.register("contactPersonName", { required: "Required" })}
                            error={!!form.formState.errors.contactPersonName}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Designation"
                            {...form.register("contactPersonDesignation")}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Mobile Number"
                            {...form.register("mobileNumber", {
                                required: "Required",
                                pattern: { value: MOBILE_REGEX, message: "Invalid Mobile" }
                            })}
                            error={!!form.formState.errors.mobileNumber}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Secondary Mobile"
                            {...form.register("secondaryMobileNumber")}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Email ID"
                            {...form.register("emailId", {
                                required: "Required",
                                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
                            })}
                            error={!!form.formState.errors.emailId}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Office Number" {...form.register("officeNumber")} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Fax Number" {...form.register("faxNumber")} />
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
