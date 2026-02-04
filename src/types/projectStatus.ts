export interface ProjectStatus {
    id: string;
    name: string;
    applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
    scrutinyStatus: 'NOT_SUBMITTED' | 'UNDER_SCRUTINY' | 'COMPLETED' | 'REJECTED';
    correctionStatus: 'NOT_SUBMITTED' | 'PENDING' | 'COMPLETED';
    certificateUrl?: string | null;
    applicationPreviewUrl?: string | null;
    extensionStatus?: string;
    extensionCertificateUrl?: string | null;
}

export interface ProjectStatusResponse {
    project: ProjectStatus;
}
