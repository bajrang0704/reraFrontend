import * as z from "zod";

// Regex patterns
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const AADHAR_REGEX = /^[0-9]{12}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const MOBILE_REGEX = /^[0-9]{10}$/;
const PINCODE_REGEX = /^[0-9]{6}$/;

// Address Schema
export const addressSchema = z.object({
    houseNumber: z.string().optional(),
    buildingName: z.string().optional(),
    streetName: z.string().optional(),
    locality: z.string().optional(),
    landmark: z.string().optional(),
    state: z.string().min(1, "State is required"),
    district: z.string().min(1, "District is required"),
    mandal: z.string().min(1, "Mandal is required"),
    villageCityTown: z.string().min(1, "Village/City/Town is required"),
    pincode: z.string().regex(PINCODE_REGEX, "Pincode must be 6 digits"),
});

// Individual Schema (without refine for zodResolver compatibility)
export const individualProfileSchema = z.object({
    informationType: z.literal("INDIVIDUAL"),
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
    panNumber: z.string().regex(PAN_REGEX, "Invalid PAN format (e.g., ABCDE1234F)"),
    aadharNumber: z.string().regex(AADHAR_REGEX, "Aadhar must be 12 digits"),
    fatherFullName: z.string().min(1, "Father's full name is required"),
    hasPastExperience: z.boolean(),
    hasGst: z.boolean(),
    gstNumber: z.string().optional(),
    address: addressSchema,
    mobileNumber: z.string().regex(MOBILE_REGEX, "Mobile must be 10 digits"),
    emailId: z.string().email("Invalid email address"),
    officeNumber: z.string().optional(),
    faxNumber: z.string().optional(),
    websiteUrl: z.string().optional(),
    profileImageUrl: z.string().optional(),
});

// Organization Schema (without refine for zodResolver compatibility)
export const organizationProfileSchema = z.object({
    informationType: z.literal("ORGANIZATION"),
    organizationType: z.enum([
        "COMPANY",
        "PARTNERSHIP",
        "TRUST",
        "SOCIETIES",
        "PUBLIC_AUTHORITY",
        "OTHERS",
        "PROPRIETORSHIP",
        "LLP",
    ]),
    organizationName: z.string().min(1, "Organization name is required"),
    panNumber: z.string().regex(PAN_REGEX, "Invalid PAN format"),
    hasPastExperience: z.boolean(),
    hasGst: z.boolean(),
    gstNumber: z.string().optional(),
    address: addressSchema,
    contactPersonName: z.string().min(1, "Contact person name is required"),
    contactPersonDesignation: z.string().optional(),
    mobileNumber: z.string().regex(MOBILE_REGEX, "Mobile must be 10 digits"),
    secondaryMobileNumber: z.string().optional(),
    officeNumber: z.string().optional(),
    faxNumber: z.string().optional(),
    emailId: z.string().email("Invalid email address"),
    websiteUrl: z.string().optional(),
});

export type IndividualProfileFormData = z.infer<typeof individualProfileSchema>;
export type OrganizationProfileFormData = z.infer<typeof organizationProfileSchema>;
export type ProfileFormData = IndividualProfileFormData | OrganizationProfileFormData;

// Validation helper for GST (call this manually before submit)
export function validateGstIfRequired(data: ProfileFormData): string | null {
    if (data.hasGst && (!data.gstNumber || data.gstNumber === "")) {
        return "GST Number is required when 'Has GST' is Yes";
    }
    if (data.gstNumber && !GST_REGEX.test(data.gstNumber)) {
        return "Invalid GST format";
    }
    return null;
}
