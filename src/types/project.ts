// Project Types

// Enums
export type AuthorityName = 'DTCP' | 'GHMC' | 'TGIIC' | 'HMDA';
export type ProjectStatusType = 'ONGOING' | 'NEW';
export type ProjectType = 'COMMERCIAL' | 'RESIDENTIAL' | 'PLOTTED_DEVELOPMENT' | 'MIXED_DEVELOPMENT';
export type BankAccountType = 'COLLECTION_100' | 'SEPARATE_70' | 'TRANSACTION_30';

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
