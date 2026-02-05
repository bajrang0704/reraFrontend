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
            orgMembers: [],
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

                    // Determine profile type
                    const profileType = backendProfile.profileType ||
                        (backendProfile.infoType === "INDIVIDUAL" ? "INDIVIDUAL" : "OTHER_THAN_INDIVIDUAL") ||
                        backendProfile.informationType || "INDIVIDUAL";

                    const isIndividual = profileType === "INDIVIDUAL";

                    // Get the nested details object based on profile type
                    const details = isIndividual
                        ? (backendProfile.individualDetails || backendProfile)
                        : (backendProfile.organizationDetails || backendProfile);

                    if (isIndividual) {
                        // Map Individual profile
                        const frontendProfile: IndividualFormData = {
                            informationType: "INDIVIDUAL",
                            firstName: details.firstName || "",
                            lastName: details.lastName || "",
                            fatherFullName: details.fatherFullName || "",
                            panNumber: details.panNumber || "",
                            aadharNumber: details.aadhaarNumber || details.aadharNumber || "",
                            hasPastExperience: details.hasPastExperience ?? false,
                            hasGst: details.hasGstNumber ?? details.hasGst ?? false,
                            gstNumber: details.gstNumber || "",
                            mobileNumber: details.mobileNumber || "",
                            emailId: details.emailAddress || details.emailId || "",
                            officeNumber: details.officeNumber || "",
                            address: {
                                houseNumber: details.houseNumber || "",
                                buildingName: details.buildingName || "",
                                streetName: details.streetName || "",
                                locality: details.locality || "",
                                landmark: details.landmark || "",
                                state: details.state || "Telangana",
                                district: details.district || "",
                                mandal: details.mandal || "",
                                villageCityTown: details.village || details.villageCityTown || "",
                                pincode: details.pinCode || details.pincode || ""
                            }
                        };
                        setInformationType("INDIVIDUAL");
                        individualForm.reset(frontendProfile);

                        // Load cascading data for individual
                        if (frontendProfile.address.district) {
                            const mandalsData = await profileApi.getMandals(frontendProfile.address.district);
                            setMandals(mandalsData);
                            if (frontendProfile.address.mandal) {
                                const villagesData = await profileApi.getVillages(frontendProfile.address.mandal);
                                setVillages(villagesData);
                            }
                        }
                    } else {
                        // Map Organization profile
                        const frontendProfile: OrganizationFormData = {
                            informationType: "ORGANIZATION",
                            organizationType: backendProfile.entityType || details.organizationType || details.orgType || "",
                            orgTypeDescription: details.organizationTypeOther || details.orgTypeDescription || "",
                            organizationName: details.organizationName || details.orgName || "",
                            panNumber: details.panNumber || "",
                            hasPastExperience: details.hasPastExperience ?? false,
                            hasGst: details.hasGst ?? details.hasGstNumber ?? false,
                            gstNumber: details.gstNumber || "",
                            contactPersonName: details.contactPersonName || "",
                            contactPersonDesignation: details.contactPersonDesignation || details.contactDesignation || "",
                            mobileNumber: details.mobileNumber || "",
                            secondaryMobileNumber: details.secondaryMobileNumber || details.secondaryMobile || "",
                            emailId: details.email || details.emailId || "",
                            officeNumber: details.officeNumber || "",
                            faxNumber: details.faxNumber || "",
                            websiteUrl: details.websiteUrl || "",
                            orgMembers: backendProfile.members || details.orgMembers || [],
                            address: {
                                houseNumber: details.houseNumber || "",
                                buildingName: details.buildingName || "",
                                streetName: details.streetName || "",
                                locality: details.locality || "",
                                landmark: details.landmark || "",
                                state: details.state || "Telangana",
                                district: details.district || "",
                                mandal: details.mandal || "",
                                villageCityTown: details.village || details.villageCityTown || "",
                                pincode: details.pinCode || details.pincode || ""
                            }
                        };
                        setInformationType("ORGANIZATION");
                        organizationForm.reset(frontendProfile);

                        // Load cascading data for organization
                        if (frontendProfile.address?.district) {
                            const mandalsData = await profileApi.getMandals(frontendProfile.address.district);
                            setMandals(mandalsData);
                            if (frontendProfile.address.mandal) {
                                const villagesData = await profileApi.getVillages(frontendProfile.address.mandal);
                                setVillages(villagesData);
                            }
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
            // Build payload matching backend structure
            let payload: any;

            if (data.informationType === "INDIVIDUAL") {
                const individualData = data as IndividualFormData;
                payload = {
                    profileType: "INDIVIDUAL",
                    entityType: null,
                    individualDetails: {
                        firstName: individualData.firstName,
                        lastName: individualData.lastName,
                        fatherFullName: individualData.fatherFullName,
                        panNumber: individualData.panNumber,
                        aadhaarNumber: (individualData as any).aadharNumber,
                        hasPastExperience: individualData.hasPastExperience,
                        hasGstNumber: individualData.hasGst,
                        gstNumber: individualData.gstNumber || null,
                        // Address fields (flat)
                        houseNumber: individualData.address.houseNumber,
                        buildingName: individualData.address.buildingName,
                        streetName: individualData.address.streetName,
                        locality: individualData.address.locality,
                        landmark: individualData.address.landmark,
                        state: individualData.address.state,
                        district: individualData.address.district,
                        mandal: individualData.address.mandal,
                        village: individualData.address.villageCityTown,
                        pinCode: individualData.address.pincode,
                        // Contact info
                        mobileNumber: individualData.mobileNumber,
                        emailAddress: individualData.emailId,
                        officeNumber: individualData.officeNumber,
                    }
                };
            } else {
                const orgData = data as OrganizationFormData;
                payload = {
                    profileType: "OTHER_THAN_INDIVIDUAL",
                    entityType: orgData.organizationType,
                    organizationDetails: {
                        organizationType: orgData.organizationType,
                        organizationTypeOther: orgData.orgTypeDescription || null,
                        organizationName: orgData.organizationName,
                        panNumber: orgData.panNumber,
                        hasPastExperience: orgData.hasPastExperience,
                        turnoverOver20Lakhs: false, // Add field if needed
                        hasGst: orgData.hasGst,
                        gstNumber: orgData.gstNumber || null,
                        // Address fields (flat)
                        houseNumber: orgData.address?.houseNumber,
                        buildingName: orgData.address?.buildingName,
                        streetName: orgData.address?.streetName,
                        locality: orgData.address?.locality,
                        landmark: orgData.address?.landmark,
                        state: orgData.address?.state || "Telangana",
                        district: orgData.address?.district,
                        mandal: orgData.address?.mandal,
                        village: orgData.address?.villageCityTown,
                        pinCode: orgData.address?.pincode,
                        // Contact info
                        contactPersonName: orgData.contactPersonName,
                        contactPersonDesignation: orgData.contactPersonDesignation,
                        mobileNumber: orgData.mobileNumber,
                        secondaryMobileNumber: orgData.secondaryMobileNumber,
                        email: orgData.emailId,
                        officeNumber: orgData.officeNumber,
                        faxNumber: orgData.faxNumber,
                        websiteUrl: orgData.websiteUrl,
                    },
                    // Members are managed via org members array
                    members: orgData.orgMembers || []
                };
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
                    onSubmit={onSubmit}
                    saving={saving}
                    districts={districts}
                    mandals={mandals}
                    villages={villages}
                    onDistrictChange={handleDistrictChange}
                    onMandalChange={handleMandalChange}
                />
            )}
        </Box>
    );
}
