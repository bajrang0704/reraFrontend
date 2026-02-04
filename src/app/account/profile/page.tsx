"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { profileApi } from "@/lib/api/profile";
import { useAuth } from "@/context/AuthContext";
import { District, Mandal, Village, InformationType, Profile } from "@/types/profile";
import {
    Box,
    FormControl,
    FormControlLabel,
    Paper,
    Radio,
    RadioGroup,
    Typography,
    CircularProgress
} from "@mui/material";
import { IndividualFormData, OrganizationFormData } from "./types";
import IndividualForm from "./components/IndividualForm";
import OrganizationForm from "./components/OrganizationForm";

export default function MyProfilePage() {
    const { user, isInitializing } = useAuth();
    const [informationType, setInformationType] = useState<InformationType>("INDIVIDUAL");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [districts, setDistricts] = useState<District[]>([]);
    const [mandals, setMandals] = useState<Mandal[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);

    const individualForm = useForm<IndividualFormData>({
        defaultValues: {
            informationType: "INDIVIDUAL",
            hasPastExperience: false,
            hasGst: false,
            address: { state: "Telangana", district: "", mandal: "", villageCityTown: "", pincode: "" },
        },
    });

    const organizationForm = useForm<OrganizationFormData>({
        defaultValues: {
            informationType: "ORGANIZATION",
            hasPastExperience: false,
            hasGst: false,
            address: { state: "Telangana", district: "", mandal: "", villageCityTown: "", pincode: "" },
        },
    });

    useEffect(() => {
        const loadData = async () => {
            if (isInitializing) return; // Wait for auth to initialize
            if (!user?.projectId) {
                setLoading(false);
                return;
            }
            try {
                const [profileData, districtsData] = await Promise.all([
                    profileApi.getProfile(user.projectId),
                    profileApi.getDistricts(),
                ]);
                setDistricts(districtsData);

                // Backend returns 'data' key for profile, but our type expected 'profile'. Handling both.
                const profileObj = (profileData as any).data || profileData.profile;

                if (profileObj) {
                    const backendProfile = profileObj as any;

                    // Transform backend flat structure to frontend nested structure
                    const frontendProfile = {
                        ...backendProfile,
                        // Common mappings
                        informationType: backendProfile.infoType || backendProfile.informationType,
                        emailId: backendProfile.emailAddress || backendProfile.emailId || "",
                        hasGst: backendProfile.hasGstNumber ?? backendProfile.hasGst ?? false,

                        // Address mapping
                        address: {
                            state: backendProfile.state || backendProfile.address?.state || "Telangana",
                            district: backendProfile.district || backendProfile.address?.district || "",
                            mandal: backendProfile.mandal || backendProfile.address?.mandal || "",
                            villageCityTown: backendProfile.village || backendProfile.address?.villageCityTown || "",
                            pincode: backendProfile.pinCode || backendProfile.pincode || backendProfile.address?.pincode || "",
                            houseNumber: backendProfile.houseNumber || backendProfile.address?.houseNumber || "",
                            buildingName: backendProfile.buildingName || backendProfile.address?.buildingName || "",
                            streetName: backendProfile.streetName || backendProfile.address?.streetName || "",
                            locality: backendProfile.locality || backendProfile.address?.locality || "",
                            landmark: backendProfile.landmark || backendProfile.address?.landmark || ""
                        }
                    };

                    // Individual specifics
                    if (frontendProfile.informationType === "INDIVIDUAL") {
                        (frontendProfile as any).aadharNumber = backendProfile.aadhaarNumber || backendProfile.aadharNumber || "";
                    }
                    // Organization specifics
                    else {
                        (frontendProfile as any).organizationType = backendProfile.orgType || backendProfile.organizationType || "";
                        (frontendProfile as any).organizationName = backendProfile.orgName || backendProfile.organizationName || "";
                        (frontendProfile as any).contactPersonDesignation = backendProfile.contactDesignation || backendProfile.contactPersonDesignation || "";
                        (frontendProfile as any).secondaryMobileNumber = backendProfile.secondaryMobile || backendProfile.secondaryMobileNumber || "";
                    }

                    setInformationType(frontendProfile.informationType);
                    if (frontendProfile.informationType === "INDIVIDUAL") {
                        individualForm.reset(frontendProfile as IndividualFormData);
                    } else {
                        organizationForm.reset(frontendProfile as OrganizationFormData);
                    }

                    // Load cascading data
                    if (frontendProfile.address.district) {
                        try {
                            const mandalsData = await profileApi.getMandals(frontendProfile.address.district);
                            setMandals(mandalsData);

                            if (frontendProfile.address.mandal) {
                                try {
                                    const villagesData = await profileApi.getVillages(frontendProfile.address.mandal);
                                    setVillages(villagesData);
                                } catch (e) {
                                    console.warn("Failed to load villages", e);
                                    setVillages([]);
                                }
                            }
                        } catch (e) {
                            console.warn("Failed to load mandals", e);
                            setMandals([]);
                        }
                    }

                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.projectId, isInitializing]);

    // Helpers for location changes
    const handleDistrictChange = async (districtId: string, form: any) => {
        // Don't set district here - field.onChange in AddressSection handles it
        form.setValue("address.mandal", "", { shouldValidate: true });
        form.setValue("address.villageCityTown", "", { shouldValidate: true });
        setVillages([]);
        if (districtId) {
            try {
                const mandalsData = await profileApi.getMandals(districtId);
                setMandals(mandalsData);
            } catch (error) {
                console.error("Error fetching mandals:", error);
                setMandals([]);
            }
        } else {
            setMandals([]);
        }
    };

    const handleMandalChange = async (mandalId: string, form: any) => {
        // Don't set mandal here - field.onChange in AddressSection handles it
        form.setValue("address.villageCityTown", "", { shouldValidate: true });
        if (mandalId) {
            try {
                const villagesData = await profileApi.getVillages(mandalId);
                setVillages(villagesData);
            } catch (error) {
                console.error("Error fetching villages:", error);
                setVillages([]);
            }
        } else {
            setVillages([]);
        }
    };

    const onSubmit = async (data: IndividualFormData | OrganizationFormData) => {
        if (!user?.projectId) {
            alert("Project ID not found");
            return;
        }
        setSaving(true);
        try {
            // Transform frontend nested structure to backend flat structure
            const payload: any = {
                ...data,
                infoType: data.informationType,
                emailAddress: data.emailId,
                hasGstNumber: data.hasGst,
                // Flatten address
                district: data.address.district,
                mandal: data.address.mandal,
                village: data.address.villageCityTown,
                pinCode: data.address.pincode,
                houseNumber: data.address.houseNumber,
                buildingName: data.address.buildingName,
                streetName: data.address.streetName,
                locality: data.address.locality,
                landmark: data.address.landmark,
                state: data.address.state
            };

            if (data.informationType === "INDIVIDUAL") {
                payload.aadhaarNumber = (data as any).aadharNumber;
            } else {
                payload.orgType = (data as any).organizationType;
                payload.orgName = (data as any).organizationName;
                payload.contactDesignation = (data as any).contactPersonDesignation;
                payload.secondaryMobile = (data as any).secondaryMobileNumber;
            }

            const response = await profileApi.saveProfile(user.projectId, payload);
            alert("Profile saved successfully!");
        } catch (error) {
            console.error("Failed to save profile", error);
            alert("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    if (isInitializing || loading) return (
        <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>My Profile</Typography>

            <Paper sx={{ mb: 4, p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>General Information</Typography>
                <FormControl component="fieldset">
                    <RadioGroup
                        row
                        value={informationType}
                        onChange={(e) => setInformationType(e.target.value as InformationType)}
                    >
                        <FormControlLabel value="INDIVIDUAL" control={<Radio />} label="Individual" />
                        <FormControlLabel value="ORGANIZATION" control={<Radio />} label="Other Than Individual" />
                    </RadioGroup>
                </FormControl>
            </Paper>

            {informationType === "INDIVIDUAL" ? (
                <IndividualForm
                    form={individualForm}
                    districts={districts}
                    mandals={mandals}
                    villages={villages}
                    onDistrictChange={handleDistrictChange}
                    onMandalChange={handleMandalChange}
                    onSubmit={onSubmit}
                    saving={saving}
                />
            ) : (
                <OrganizationForm
                    form={organizationForm}
                    districts={districts}
                    mandals={mandals}
                    villages={villages}
                    onDistrictChange={handleDistrictChange}
                    onMandalChange={handleMandalChange}
                    onSubmit={onSubmit}
                    saving={saving}
                />
            )}
        </Box>
    );
}
