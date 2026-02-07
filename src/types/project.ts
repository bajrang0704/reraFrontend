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

// Full Create Project Request (Unified)
export interface CreateProjectFullRequest extends CreateProjectRequest {
    landDetail: Omit<LandDetail, 'id'>;
    builtupDetail: Omit<BuiltupDetail, 'id'>;
    address: Omit<ProjectAddress, 'id'>;
    gis: Omit<GISData, 'id'>;
    bankAccounts: Omit<BankAccount, 'id'>[];
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

// --- Project Cost Types ---

export interface CostHead {
    code: string;
    label: string;
    section: string;
    displayOrder: number;
}

export interface ProjectCost {
    costHeadCode: string;
    estimatedAmount: number;
    actualAmount: number;
}

export interface SavedCostResponse {
    success: boolean;
    data: {
        projectId: string;
        costs: ProjectCost[];
        totalEstimatedCost?: number;
        totalActualCost?: number;
    };
}

export interface DocumentType {
    code: string;
    label: string;
    mandatoryForOngoingOnly: boolean;
    allowsCustomName: boolean;
    displayOrder: number;
}

export interface ProjectDocument {
    id: string;
    documentTypeCode: string;
    documentTypeLabel: string;
    customDocumentName?: string | null;
    fileName?: string;
    fileMimeType?: string;
    fileSize?: number;
    createdAt?: string;
}

export interface DocumentListResponse {
    success: boolean;
    data: {
        documents: ProjectDocument[];
    };
}

// --- Project Professionals Types ---

export enum ProfessionalType {
    ARCHITECT = "ARCHITECT",
    STRUCTURAL_ENGINEER = "STRUCTURAL_ENGINEER",
    REAL_ESTATE_AGENT = "REAL_ESTATE_AGENT",
    CONTRACTOR = "CONTRACTOR",
    OTHER = "OTHER"
}

export interface ProjectProfessional {
    id: string;
    projectId: string;
    professionalType: ProfessionalType;
    name: string;
    address: string;
    aadhaarNo?: string;
    contactNo: string;
    email?: string; // Often useful context, though not strictly in mock
    reraCertificateNo?: string; // For Agents
    coaCertificateNo?: string;  // For Architects
    designation?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProfessionalResponse {
    success: boolean;
    data: ProjectProfessional[];
}

// --- Project Litigation Types ---

export type CaseType = 'CIVIL' | 'CRIMINAL' | 'OTHERS';
export type PetitionType = 'WRIT_PETITION' | 'SUIT' | 'OTHER';

export interface LitigationDocument {
    id: string;
    fileName: string;
    uploadedAt: string;
}

export interface ProjectLitigation {
    id: string;
    projectId: string;
    courtName: string;
    caseType: CaseType;
    caseTypeOther?: string;
    petitionType: PetitionType;
    petitionTypeOther?: string;
    caseNumber: string;
    caseYear: number | string; // API says 2022 (number), but form might handle string. API contract says 2022.
    hasInterimOrder: boolean;
    presentStatus: string;
    documents?: LitigationDocument[];
    created_at?: string;
    updated_at?: string;
}

export interface LitigationResponse {
    success: boolean;
    data: ProjectLitigation[];
}

// --- Building Task Progress Types ---

export interface BuildingTaskMaster {
    code: string;
    label: string;
    displayOrder: number;
}

export interface BuildingTaskProgress {
    taskCode: string;
    percentageOfWork: number;
}

export interface BuildingProgressResponse {
    success: boolean;
    data: {
        buildingId: string;
        tasks: BuildingTaskProgress[];
    };
}
