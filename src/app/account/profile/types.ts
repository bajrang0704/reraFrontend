import { OrganizationType, OrgMember } from "@/types/profile";

// Regex patterns
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const AADHAR_REGEX = /^[0-9]{12}$/;
export const MOBILE_REGEX = /^[0-9]{10}$/;
export const PINCODE_REGEX = /^[0-9]{6}$/;

export const ORGANIZATION_TYPES: { value: OrganizationType; label: string }[] = [
    { value: "COMPANY", label: "Company" },
    { value: "PARTNERSHIP", label: "Partnership" },
    { value: "TRUST", label: "Trust" },
    { value: "SOCIETIES", label: "Societies" },
    { value: "PUBLIC_AUTHORITY", label: "Public Authority" },
    { value: "OTHERS", label: "Others" },
    { value: "PROPRIETORSHIP", label: "Proprietorship" },
    { value: "LLP", label: "LLP" },
];

export interface AddressData {
    houseNumber?: string;
    buildingName?: string;
    streetName?: string;
    locality?: string;
    landmark?: string;
    state: string;
    district: string;
    mandal: string;
    villageCityTown: string;
    pincode: string;
}

export interface IndividualFormData {
    informationType: "INDIVIDUAL";
    firstName: string;
    middleName?: string;
    lastName: string;
    panNumber: string;
    aadharNumber: string;
    fatherFullName: string;
    hasPastExperience: boolean;
    hasGst: boolean;
    gstNumber?: string;
    address: AddressData;
    mobileNumber: string;
    emailId: string;
    officeNumber?: string;
    faxNumber?: string;
    websiteUrl?: string;
    imageUrl?: string;
}

export interface OrganizationFormData {
    informationType: "ORGANIZATION";
    organizationType: OrganizationType;
    orgTypeDescription?: string;
    organizationName: string;
    panNumber: string;
    hasPastExperience: boolean;
    hasGst: boolean;
    gstNumber?: string;
    address: AddressData;
    contactPersonName: string;
    contactPersonDesignation?: string;
    mobileNumber: string;
    secondaryMobileNumber?: string;
    officeNumber?: string;
    faxNumber?: string;
    emailId: string;
    websiteUrl?: string;
    imageUrl?: string;
    orgMembers?: OrgMember[];
}
