"use client";

import { useState, useEffect } from "react";
import { UseFormReturn, Controller } from "react-hook-form";
import { District, Mandal, Village, OrgMember, Designation } from "@/types/profile";
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
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Alert
} from "@mui/material";
import { OrganizationFormData, PAN_REGEX, MOBILE_REGEX, ORGANIZATION_TYPES } from "../types";
import AddressSection from "./AddressSection";
import MemberForm from "./MemberForm";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { profileApi } from "@/lib/api/profile";

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
    const [editingMember, setEditingMember] = useState<OrgMember | null>(null);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [validationError, setValidationError] = useState<string | null>(null);

    const members: OrgMember[] = form.watch("orgMembers") || [];
    const organizationType = form.watch("organizationType");

    // Fetch designations when organization type changes
    useEffect(() => {
        if (organizationType && organizationType !== "OTHERS") {
            console.log("Fetching designations for:", organizationType);
            profileApi.getDesignations(organizationType)
                .then((data) => {
                    console.log("Fetched designations:", data);
                    setDesignations(data);
                })
                .catch((err) => {
                    console.error("Error fetching designations:", err);
                    setDesignations([]);
                });
        } else {
            setDesignations([]);
        }
    }, [organizationType]);

    const handleSaveMember = (member: OrgMember) => {
        const currentMembers = form.getValues("orgMembers") || [];
        if (editIndex !== null) {
            const updated = [...currentMembers];
            updated[editIndex] = member;
            form.setValue("orgMembers", updated);
            setEditingMember(null);
            setEditIndex(null);
        } else {
            form.setValue("orgMembers", [...currentMembers, member]);
        }
        setValidationError(null);
    };

    const handleEditMember = (member: OrgMember, index: number) => {
        setEditingMember(member);
        setEditIndex(index);
    };

    const handleDeleteMember = (index: number) => {
        const currentMembers = form.getValues("orgMembers") || [];
        const updated = currentMembers.filter((_, i) => i !== index);
        form.setValue("orgMembers", updated);
        if (editIndex === index) {
            setEditingMember(null);
            setEditIndex(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingMember(null);
        setEditIndex(null);
    };

    // Find designation label by code
    const getDesignationLabel = (code: string) => {
        const d = designations.find(d => d.code === code);
        return d?.label || code;
    };

    // Validate AUTH_SIGNATORY before submit
    const handleFormSubmit = (data: OrganizationFormData) => {
        if (organizationType && organizationType !== "OTHERS") {
            const hasAuthSignatory = members.some(m => m.designationCode === "AUTH_SIGNATORY");
            const mandatoryDesignations = designations.filter(d => d.isMandatory);

            for (const mandatory of mandatoryDesignations) {
                const hasMandatory = members.some(m => m.designationCode === mandatory.code);
                if (!hasMandatory) {
                    setValidationError(`At least one "${mandatory.label}" is required`);
                    return;
                }
            }
        }
        setValidationError(null);
        onSubmit(data);
    };

    const showPartnerDetails = organizationType && organizationType !== "OTHERS";

    // Log validation errors for debugging
    const onInvalid = (errors: any) => {
        console.error("Form validation errors:", errors);
        alert("Please fill all required fields. Check console for details.");
    };

    return (
        <form onSubmit={form.handleSubmit(handleFormSubmit, onInvalid)}>
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
                                    required
                                    error={!!form.formState.errors.organizationType}
                                >
                                    {ORGANIZATION_TYPES.map(type => (
                                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    </Grid>
                    {form.watch("organizationType") === "OTHERS" && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Please specify"
                                required
                                {...form.register("orgTypeDescription", { required: "Required" })}
                                error={!!form.formState.errors.orgTypeDescription}
                            />
                        </Grid>
                    )}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Organization Name"
                            required
                            {...form.register("organizationName", { required: "Required" })}
                            error={!!form.formState.errors.organizationName}
                        />
                    </Grid>

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
                        <Typography variant="subtitle2" gutterBottom>
                            Do you have Past Experience? <span style={{ color: "red" }}>*</span>
                        </Typography>
                        <Controller
                            name="hasPastExperience"
                            control={form.control}
                            rules={{ validate: (value) => typeof value === 'boolean' || "Required" }}
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
                            rules={{ validate: (value) => typeof value === 'boolean' || "Required" }}
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
                            required
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
                            required
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
                            required
                            {...form.register("secondaryMobileNumber", { required: "Required" })}
                            error={!!form.formState.errors.secondaryMobileNumber}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            size="small"
                            fullWidth
                            label="Email ID"
                            required
                            {...form.register("emailId", {
                                required: "Required",
                                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
                            })}
                            error={!!form.formState.errors.emailId}
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
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField size="small" fullWidth label="Website URL" {...form.register("websiteUrl")} />
                    </Grid>
                </Grid>
            </Paper>

            {/* Partner/Member Details (Conditional) */}
            {showPartnerDetails && (
                <>
                    {validationError && (
                        <Alert severity="error" sx={{ mb: 2 }}>{validationError}</Alert>
                    )}

                    <MemberForm
                        onSave={handleSaveMember}
                        onCancel={handleCancelEdit}
                        initialData={editingMember}
                        districts={districts}
                        designations={designations}
                    />

                    {/* Members Table */}
                    {members.length > 0 && (
                        <TableContainer component={Paper} sx={{ mb: 4 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: "grey.100" }}>
                                    <TableRow>
                                        <TableCell>First Name</TableCell>
                                        <TableCell>Middle Name</TableCell>
                                        <TableCell>Last Name</TableCell>
                                        <TableCell>Designation</TableCell>
                                        <TableCell>PAN Number</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {members.map((member, index) => (
                                        <TableRow key={index} selected={editIndex === index}>
                                            <TableCell>{member.firstName}</TableCell>
                                            <TableCell>{member.middleName}</TableCell>
                                            <TableCell>{member.lastName}</TableCell>
                                            <TableCell>{getDesignationLabel(member.designationCode)}</TableCell>
                                            <TableCell>{member.panNumber}</TableCell>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => handleEditMember(member, index)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteMember(index)}>
                                                    <DeleteIcon fontSize="small" color="error" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 2 }}>
                        Click on add member button to add member details. After records are added, updated or deleted click on save button.
                    </Typography>
                </>
            )}

            <Box display="flex" justifyContent="flex-end">
                <Button variant="contained" type="submit" size="large" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                </Button>
            </Box>
        </form>
    );
}
