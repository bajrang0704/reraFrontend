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

// Past Experience Record
export interface PastExperience {
    id: string;
    projectName: string;
    completionYear: number;
    location: string;
    details?: string;
}

// Organization Other Member
export interface OrgMember {
    id: string;
    name: string;
    designation: string;
    panNumber?: string;
    aadharNumber?: string;
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
    districtCode: string;
}

export interface Village {
    code: string;
    name: string;
    mandalCode: string;
}
