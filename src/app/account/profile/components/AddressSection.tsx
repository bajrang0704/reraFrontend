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
}

export default function AddressSection({
    form,
    districts,
    mandals,
    villages,
    onDistrictChange,
    onMandalChange,
    title = "Address For Official Communication"
}: AddressSectionProps) {
    return (
        <Paper sx={{ mb: 4, p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>{title}</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField size="small" fullWidth label="House Number" {...form.register("address.houseNumber")} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField size="small" fullWidth label="Building Name" {...form.register("address.buildingName")} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField size="small" fullWidth label="Street Name" {...form.register("address.streetName")} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField size="small" fullWidth label="Locality" {...form.register("address.locality")} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField size="small" fullWidth label="Landmark" {...form.register("address.landmark")} />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField size="small" fullWidth label="State" value="Telangana" disabled />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                        name="address.district"
                        control={form.control}
                        rules={{ required: "Required" }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                size="small"
                                select
                                fullWidth
                                label="District"
                                error={!!(form.formState.errors.address as FieldErrors)?.district}
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
                        name="address.mandal"
                        control={form.control}
                        rules={{ required: "Required" }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                size="small"
                                select
                                fullWidth
                                label="Mandal"
                                disabled={!form.watch("address.district")}
                                error={!!(form.formState.errors.address as FieldErrors)?.mandal}
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
                        name="address.villageCityTown"
                        control={form.control}
                        rules={{ required: "Required" }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                size="small"
                                select
                                fullWidth
                                label="Village/City/Town"
                                disabled={!form.watch("address.mandal")}
                                error={!!(form.formState.errors.address as FieldErrors)?.villageCityTown}
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
                        {...form.register("address.pincode", {
                            required: "Required",
                            pattern: { value: PINCODE_REGEX, message: "Invalid Pincode" }
                        })}
                        error={!!(form.formState.errors.address as FieldErrors)?.pincode}
                    />
                </Grid>
            </Grid>
        </Paper>
    );
}
