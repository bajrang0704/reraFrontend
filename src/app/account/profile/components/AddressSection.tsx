"use client";

import { Controller, FieldErrors, UseFormReturn } from "react-hook-form";
import { District, Mandal, Village } from "@/types/profile";
import { Grid, MenuItem, Paper, TextField, Typography } from "@mui/material";
import { PINCODE_REGEX } from "../types";

interface AddressSectionProps {
    form: UseFormReturn<any>;
    districts: District[];
    mandals: Mandal[];
    villages: Village[];
    onDistrictChange: (districtId: string, form: any) => void;
    onMandalChange: (mandalId: string, form: any) => void;
    title?: string;
    prefix?: string;
}

export default function AddressSection({
    form,
    districts,
    mandals,
    villages,
    onDistrictChange,
    onMandalChange,
    title = "Address For Official Communication",
    prefix = "address"
}: AddressSectionProps) {
    const getError = (fieldName: string) => {
        const errors = form.formState.errors as any;
        const group = errors[prefix];
        return group?.[fieldName];
    };

    return (
        <Paper sx={{ mb: 4, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>{title}</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="House Number"
                        required
                        {...form.register(`${prefix}.houseNumber`, { required: "Required" })}
                        error={!!getError("houseNumber")}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="Building Name"
                        required
                        {...form.register(`${prefix}.buildingName`, { required: "Required" })}
                        error={!!getError("buildingName")}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="Street Name"
                        required
                        {...form.register(`${prefix}.streetName`, { required: "Required" })}
                        error={!!getError("streetName")}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="Locality"
                        required
                        {...form.register(`${prefix}.locality`, { required: "Required" })}
                        error={!!getError("locality")}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        size="small"
                        fullWidth
                        label="Landmark"
                        required
                        {...form.register(`${prefix}.landmark`, { required: "Required" })}
                        error={!!getError("landmark")}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField size="small" fullWidth label="State" value="Telangana" disabled />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                        name={`${prefix}.district`}
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
                                error={!!getError("district")}
                                onChange={(e) => {
                                    field.onChange(e.target.value);
                                    onDistrictChange(e.target.value, form);
                                }}
                            >
                                {districts.map((d) => (
                                    <MenuItem key={d.code} value={d.code}>{d.name}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                        name={`${prefix}.mandal`}
                        control={form.control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                size="small"
                                select
                                fullWidth
                                label="Mandal"
                                disabled={!form.watch(`${prefix}.district`)}
                                error={!!getError("mandal")}
                                onChange={(e) => {
                                    field.onChange(e.target.value);
                                    onMandalChange(e.target.value, form);
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
                        name={`${prefix}.villageCityTown`}
                        control={form.control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                size="small"
                                select
                                fullWidth
                                label="Village/City/Town"
                                disabled={!form.watch(`${prefix}.mandal`)}
                                error={!!getError("villageCityTown")}
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
                        size="small"
                        fullWidth
                        label="Pin Code"
                        required
                        {...form.register(`${prefix}.pincode`, {
                            required: "Required",
                            pattern: { value: PINCODE_REGEX, message: "Invalid Pincode" }
                        })}
                        error={!!getError("pincode")}
                    />
                </Grid>
            </Grid>
        </Paper>
    );
}
