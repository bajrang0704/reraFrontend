// Profile Types

export type InformationType = "INDIVIDUAL" | "ORGANIZATION";

export type OrganizationType =
    | "COMPANY"
    | "PARTNERSHIP"
    | "TRUST"
    | "SOCIETIES"
    | "PUBLIC_AUTHORITY"
    | "OTHERS"
    | "PROPRIETORSHIP"
    | "LLP";

export type OtherMemberType =
    | "INDIVIDUAL"
    | "COMPANY"
    | "PARTNERSHIP"
    | "TRUST"
    | "SOCIETIES"
    | "PUBLIC_AUTHORITY"
    | "OTHERS";

// Base Address type
export interface Address {
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

// Individual Profile
export interface IndividualProfile {
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
    address: Address;
    mobileNumber: string;
    emailId: string;
    officeNumber?: string;
    faxNumber?: string;
    websiteUrl?: string;
    profileImageUrl?: string;
}

// Organization Profile
export interface OrganizationProfile {
    informationType: "ORGANIZATION";
    organizationType: OrganizationType;
    orgTypeDescription?: string;
    organizationName: string;
    panNumber: string;
    hasPastExperience: boolean;
    hasGst: boolean;
    gstNumber?: string;
    address: Address;
    contactPersonName: string;
    contactPersonDesignation?: string;
    mobileNumber: string;
    secondaryMobileNumber?: string;
    officeNumber?: string;
    faxNumber?: string;
    emailId: string;
    websiteUrl?: string;
}

export type Profile = IndividualProfile | OrganizationProfile;

// Project Type for Past Experience
export type ProjectType = "COMMERCIAL" | "RESIDENTIAL" | "PLOTTED_DEVELOPMENT" | "MIXED_DEVELOPMENT";

// Past Experience Record (matches API spec)
export interface PastExperience {
    id: string;
    projectName: string;
    projectType: ProjectType;
    surveyOrPlotNo: string;
    projectAddress: string;
    landAreaSqMtrs: number;
    numberOfBuildingsPlotsBlocks: number;
    numberOfApartments: number; // Must be > 0 for RESIDENTIAL/MIXED. Must be 0 for PLOTTED.
    totalCostInInr: number;
    originalProposedCompletionDate: string; // YYYY-MM-DD
    actualCompletionDate: string; // Must be >= Proposed Date
}

// Organization Member (matches API spec)
export interface OrgMember {
    id?: string;
    designationCode: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    panNumber: string;
    aadhaarNumber: string;
    // Address fields (flat, matching API)
    houseNumber?: string;
    buildingName?: string;
    streetName?: string;
    locality?: string;
    landmark?: string;
    state?: string;
    district?: string;
    mandal?: string;
    village?: string;
    pinCode?: string;
    imageUrl?: string;
}

// Other Organization Member (External Entities for 'OTHERS' org type)
export interface OtherMember {
    id?: string;
    memberType: OtherMemberType;
    memberTypeOther?: string; // Required ONLY if memberType is 'OTHERS'
    name: string;
    panNumber: string; // Must be unique in this org

    // Address
    houseNumber: string;
    buildingName: string;
    streetName: string;
    locality: string;
    landmark: string;
    state: string;
    district: string;
    mandal?: string; // Optional
    city?: string; // Village/City/Town - Optional
    pinCode: string; // Must be 6 digits

    // Contact Info
    contactPersonName: string;
    contactPersonDesignation?: string;
    mobileNumber: string; // Must be 10 digits
    officeNumber?: string;
    faxNumber?: string;
    email: string;

    isActive?: boolean;
}

// API Response types
export interface ProfileResponse {
    profile: Profile | null;
    pastExperiences: PastExperience[];
    orgMembers: OrgMember[];
    sectionStatus: "DRAFT" | "COMPLETED";
}

// Location data types
export interface District {
    code: string;
    name: string;
}

export interface Mandal {
    code: string;
    name: string;
}

export interface Village {
    code: string;
    name: string;
}

// Designation for organization members
export interface Designation {
    code: string;
    label: string;
    isMandatory: boolean;
    sortOrder: number;
}
