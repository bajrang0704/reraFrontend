// Project Types

// Enums
export type AuthorityName = 'DTCP' | 'GHMC' | 'TGIIC' | 'HMDA';
export type ProjectStatusType = 'ONGOING' | 'NEW';
export type ProjectType = 'COMMERCIAL' | 'RESIDENTIAL' | 'PLOTTED_DEVELOPMENT' | 'MIXED_DEVELOPMENT';
export type BankAccountType = 'COLLECTION_100' | 'SEPARATE_70' | 'TRANSACTION_30';
export type PromoterType = 'INDIVIDUAL' | 'COMPANY' | 'PARTNERSHIP_FIRM' | 'COMPETENT_AUTHORITY' | 'LLP' | 'TRUST' | 'HINDU_UNDIVIDED_FAMILY' | 'OTHERS';
export type AgreementType = 'REVENUE_SHARE' | 'AREA_SHARE';


// Land Details
export interface LandDetail {
    id?: string;
    surveyNo: string;
    plotOrHouseNo: string;
    totalAreaSqm: number;
    areaAffectedSqm: number;
    netAreaSqm: number;
    approvedBuildingUnits: number;
    proposedBuildingUnits: number;
    boundaryEast: string;
    boundaryWest: string;
    boundaryNorth: string;
    boundarySouth: string;
}

// Builtup Details
export interface BuiltupDetail {
    id?: string;
    approvedBuiltupAreaSqm: number;
    mortgageAreaSqm: number;
}

// Project Address
export interface ProjectAddress {
    id?: string;
    state: string;
    district: string;
    mandal: string;
    village: string;
    city: string;
    street: string;
    locality: string;
    pincode: string;
}

// Bank Account
export interface BankAccount {
    id?: string;
    accountType: BankAccountType;
    bankName: string;
    branchName: string;
    ifscCode: string;
    accountNumber: string;
    bankAddress: string;
}

// GIS Data
export interface GISData {
    id?: string;
    latitude: number;
    longitude: number;
}

// Other Promoter (Land Owner / Investor)
export interface OtherPromoter {
    id: string;
    promoterName: string;
    promoterType: PromoterType;
    promoterTypeOther?: string;

    // Address
    blockNumber: string;
    buildingName: string;
    streetName: string;
    locality: string;
    landmark: string;
    state: string;
    district: string;
    mandal: string;
    village: string;
    pincode: string;

    // Contact
    contactPersonName: string;
    contactDesignation: string;
    mobileNumber: string;
    officeNumber?: string;
    faxNumber?: string;
    email: string;

    agreementType: AgreementType;

    // Bank Details (fetched/managed if AREA_SHARE)
    bankDetails?: {
        bankName: string;
        accountNumber: string;
        branchName: string;
        bankAddress: string;
        ifscCode: string;
    };
}


// Apartment Type Details
export interface ApartmentType {
    id?: string;
    floorNumber: number;
    isUnderMortgage: boolean;
    apartmentType: string;
    saleableAreaSqm: number;
    proposedNumberOfUnits: number;
    numberOfUnitsBooked: number;
}

// Building Details
export interface Building {
    id: string;
    projectId: string; // The backend uses display ID usually, but check API. Doc says path parameter.
    buildingName: string;
    proposedCompletionDate: string;

    numberOfBasements: number;
    numberOfPodiums: number;
    numberOfSlabsSuperStructure: number;
    numberOfStilts: number;

    totalParkingAreaSqm: number;
    totalNumberOfFloors: number;

    apartmentTypes: ApartmentType[];
}

// Common Areas & Facilities
export interface CommonAreaSummary {
    openParkingAreaSqm: number;
    coveredParkingCount: number;
    openParkingUnitsBooked: number;
    coveredParkingUnitsBooked: number;
    openParkingProgressPercent: number;
    coveredParkingProgressPercent: number;
}

export type FacilityScope = 'SYSTEM' | 'PROJECT_CUSTOM';

export interface Facility {
    facilityId?: string; // Optional for new custom items
    masterId?: string;   // For system items
    code?: string;
    name: string;
    scope: FacilityScope;
    proposed: boolean;
    percentageOfCompletion: number;
    details: string;
}

export interface CommonAreaResponse {
    success: boolean;
    data: {
        summary: CommonAreaSummary;
        facilities: Facility[];
    };
}

// Main Project Interface
export interface Project {
    id: string;
    projectId: string; // The formatted string ID (e.g., TSRERA/PJT/...)
    profileId: string;
    authorityName: AuthorityName;
    planApprovalNumber: string;
    projectName: string;
    projectType: ProjectType;
    projectStatus: ProjectStatusType;
    approvedDate: string;
    proposedCompletionDate: string;
    revisedProposedCompletionDate?: string | null;
    hasLitigations: boolean;
    hasOtherPromoters: boolean;
    isMsbOrHighrise: boolean;
    landDetail?: LandDetail | null;
    builtupDetail?: BuiltupDetail | null;
    address?: ProjectAddress | null;
    bankAccounts: BankAccount[];
    gis?: GISData | null;
    otherPromoters?: OtherPromoter[]; // Optional list if included in full project details
    applicationStatus?: string;

}

// Create Project Request (minimal required fields)
export interface CreateProjectRequest {
    projectId?: string; // Optional if backend auto-generates, but here we pass it
    authorityName: AuthorityName;
    planApprovalNumber: string;
    projectName: string;
    projectType: ProjectType;
    projectStatus: ProjectStatusType;
    approvedDate: string;
    proposedCompletionDate: string;
    revisedProposedCompletionDate?: string | null;
    hasLitigations: boolean;
    hasOtherPromoters: boolean;
    isMsbOrHighrise: boolean;
}

// API Response Wrappers
export interface ProjectResponse {
    success: boolean;
    canEditTotalBuildingUnits?: boolean;
    data: Project;
}

export interface ProjectListResponse {
    success: boolean;
    data: Project[];
}
