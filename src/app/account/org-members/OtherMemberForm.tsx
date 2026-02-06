"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { District, Mandal, Village, OtherMember, OtherMemberType } from "@/types/profile";
import { profileApi } from "@/lib/api/profile";
import {
    Box,
    Button,
    Grid,
    MenuItem,
    TextField,
    Typography,
} from "@mui/material";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

interface OtherMemberFormProps {
    onSave: (member: OtherMember) => void;
    onCancel: () => void;
    initialData?: OtherMember | null;
    districts: District[];
}

const MEMBER_TYPES: { value: OtherMemberType; label: string }[] = [
    { value: "INDIVIDUAL", label: "Individual" },
    { value: "COMPANY", label: "Company" },
    { value: "PARTNERSHIP", label: "Partnership Firm" },
    { value: "TRUST", label: "Trust" },
    { value: "SOCIETIES", label: "Societies" },
    { value: "PUBLIC_AUTHORITY", label: "Public Authority" },
    { value: "OTHERS", label: "Others" },
];

const emptyMember: Partial<OtherMember> = {
    memberType: "COMPANY",
    name: "",
    panNumber: "",
    houseNumber: "",
    buildingName: "",
    streetName: "",
    locality: "",
    landmark: "",
    state: "Telangana",
    district: "",
    mandal: "",
    city: "",
    pinCode: "",
    contactPersonName: "",
    contactPersonDesignation: "",
    mobileNumber: "",
    officeNumber: "",
    faxNumber: "",
    email: "",
};

export default function OtherMemberForm({ onSave, onCancel, initialData, districts }: OtherMemberFormProps) {
    const [mandals, setMandals] = useState<Mandal[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);

    const form = useForm<OtherMember>({
        defaultValues: initialData || emptyMember as OtherMember
    });

    const { control, register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = form;
    const memberType = watch("memberType");
    const selectedDistrict = watch("district");
    const selectedMandal = watch("mandal");

    // Load initial cascading data and handle reset on initialData change
    useEffect(() => {
        if (initialData) {
            reset(initialData);
            if (initialData.district) {
                profileApi.getMandals(initialData.district).then(setMandals);
                if (initialData.mandal) {
                    profileApi.getVillages(initialData.mandal).then(setVillages);
                }
            }
        } else {
            reset(emptyMember as OtherMember);
            setMandals([]);
            setVillages([]);
        }
    }, [initialData, reset]);

    const handleDistrictChange = async (districtId: string) => {
        setValue("mandal", "");
        setValue("city", ""); // Using 'city' field for Village/City/Town
        setVillages([]);
        if (districtId) {
            const res = await profileApi.getMandals(districtId);
            setMandals(res);
        } else {
            setMandals([]);
        }
    };

    const handleMandalChange = async (mandalId: string) => {
        setValue("city", "");
        if (mandalId) {
            const res = await profileApi.getVillages(mandalId);
            setVillages(res);
        } else {
            setVillages([]);
        }
    };

    const onSubmit = (data: OtherMember) => {
        onSave(data);
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <Typography variant="caption" sx={{ color: 'red', fontWeight: 'bold', mb: 3, display: 'block' }}>
                All * Mark field are mandatory.
            </Typography>

            <Grid container spacing={4} rowSpacing={3}>
                {/* Row 1: Type, Name */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="memberType"
                        control={control}
                        rules={{ required: "Required" }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                fullWidth
                                size="small"
                                label="Type of Member"
                                required
                                error={!!errors.memberType}
                            >
                                {MEMBER_TYPES.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                    {memberType === "OTHERS" && (
                        <TextField
                            sx={{ mt: 2 }}
                            fullWidth
                            size="small"
                            placeholder="Please specify"
                            {...register("memberTypeOther", { required: "Please specify member type" })}
                            error={!!errors.memberTypeOther}
                            helperText={errors.memberTypeOther?.message}
                        />
                    )}
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Name"
                        required
                        {...register("name", { required: "Required" })}
                        error={!!errors.name}
                    />
                </Grid>

                {/* Row 2: PAN (Empty right side in screenshot, but let's keep it clean) */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="PAN Number"
                        required
                        {...register("panNumber", {
                            required: "Required",
                            pattern: { value: PAN_REGEX, message: "Invalid PAN format" }
                        })}
                        error={!!errors.panNumber}
                        helperText={errors.panNumber?.message}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    {/* Placeholder for spacing if needed to match screenshot exactly, but responsiveness is better */}
                </Grid>
            </Grid>

            {/* Address Details */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#2e7d32', fontWeight: 'bold', fontSize: '1rem' }}>
                Member Address Details :
            </Typography>
            <Grid container spacing={4} rowSpacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="House No/Sy. No/Block No/Plot No"
                        required
                        {...register("houseNumber", { required: "Required" })}
                        error={!!errors.houseNumber}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Building Name"
                        required
                        {...register("buildingName", { required: "Required" })}
                        error={!!errors.buildingName}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Street Name"
                        required
                        {...register("streetName", { required: "Required" })}
                        error={!!errors.streetName}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Locality"
                        required
                        {...register("locality", { required: "Required" })}
                        error={!!errors.locality}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Land mark"
                        required
                        {...register("landmark", { required: "Required" })}
                        error={!!errors.landmark}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="State"
                        value="Telangana"
                        required
                        disabled
                        {...register("state")}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="district"
                        control={control}
                        rules={{ required: "Required" }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                fullWidth
                                size="small"
                                label="District"
                                required
                                error={!!errors.district}
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
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="mandal"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                fullWidth
                                size="small"
                                label="Mandal"
                                disabled={!selectedDistrict}
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
                <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                        name="city"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                fullWidth
                                size="small"
                                label="Village/City/Town"
                                disabled={!selectedMandal}
                            >
                                {villages.map((v) => (
                                    <MenuItem key={v.code} value={v.code}>{v.name}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Pin Code"
                        required
                        {...register("pinCode", {
                            required: "Required",
                            pattern: { value: PINCODE_REGEX, message: "Invalid Pin Code (6 digits)" }
                        })}
                        error={!!errors.pinCode}
                        helperText={errors.pinCode?.message}
                    />
                </Grid>
            </Grid>

            {/* Contact Details */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#2e7d32', fontWeight: 'bold', fontSize: '1rem' }}>
                Contact Details :
            </Typography>
            <Grid container spacing={4} rowSpacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Name of Contact Person"
                        required
                        {...register("contactPersonName", { required: "Required" })}
                        error={!!errors.contactPersonName}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Designation of Contact Person"
                        {...register("contactPersonDesignation")}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Mobile No."
                        required
                        {...register("mobileNumber", {
                            required: "Required",
                            pattern: { value: MOBILE_REGEX, message: "Invalid Mobile Number" }
                        })}
                        error={!!errors.mobileNumber}
                        helperText={errors.mobileNumber?.message}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Office No."
                        {...register("officeNumber")}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Fax No."
                        {...register("faxNumber")}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Email-ID"
                        required
                        {...register("email", {
                            required: "Required",
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" }
                        })}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                    />
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, mb: 4 }}>
                <Button
                    variant="contained"
                    type="submit"
                    disabled={isSubmitting}
                    sx={{
                        bgcolor: '#26a69a', // Teal color like in screenshot
                        '&:hover': { bgcolor: '#00897b' },
                        px: 4
                    }}
                >
                    Save Member
                </Button>
            </Box>
        </Box>
    );
}
