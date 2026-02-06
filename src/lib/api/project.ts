// Project API Functions
import { axiosInstance } from "../axios";
import {
    Project,
    ProjectResponse,
    ProjectListResponse,
    CreateProjectRequest,
    CreateProjectFullRequest,
    LandDetail,
    BuiltupDetail,
    ProjectAddress,
    BankAccount,
    GISData,
    Building,
} from "@/types/project";

export const projectApi = {
    // Create a new project (Legacy)
    createProject: async (profileId: string, data: CreateProjectRequest): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(profileId);
        const response = await axiosInstance.post<ProjectResponse>(`/profile/${encodedId}/projects`, data);
        return response.data;
    },

    // Create a new project with all details (Unified)
    createProjectFull: async (profileId: string, data: CreateProjectFullRequest): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(profileId);
        const response = await axiosInstance.post<ProjectResponse>(`/profile/${encodedId}/projects/full`, data);
        return response.data;
    },

    // List all projects for a profile
    listProjects: async (profileId: string, hasOtherPromoters?: boolean): Promise<Project[]> => {
        const encodedId = encodeURIComponent(profileId);
        const queryParam = hasOtherPromoters !== undefined ? `?hasOtherPromoters=${hasOtherPromoters}` : '';
        try {
            const response = await axiosInstance.get<ProjectListResponse>(`/profile/${encodedId}/projects${queryParam}`);
            return response.data.data || [];
        } catch (error: any) {
            if (error.response?.status === 404) return [];
            throw error;
        }
    },

    // Get a single project by ID
    getProject: async (projectId: string): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.get<ProjectResponse>(`/projects/${encodedId}`);
        return response.data;
    },

    // Update project
    updateProject: async (projectId: string, data: Partial<Project>): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.put<ProjectResponse>(`/projects/${encodedId}`, data);
        return response.data;
    },

    // Delete project
    deleteProject: async (projectId: string): Promise<void> => {
        const encodedId = encodeURIComponent(projectId);
        await axiosInstance.delete(`/projects/${encodedId}`);
    },

    // Upsert Land Details
    upsertLandDetails: async (projectId: string, data: Omit<LandDetail, 'id'>): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.put<ProjectResponse>(`/projects/${encodedId}/land`, data);
        return response.data;
    },

    // Upsert Builtup Details
    upsertBuiltupDetails: async (projectId: string, data: Omit<BuiltupDetail, 'id'>): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.put<ProjectResponse>(`/projects/${encodedId}/builtup`, data);
        return response.data;
    },

    // Upsert Address
    upsertAddress: async (projectId: string, data: Omit<ProjectAddress, 'id'>): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.put<ProjectResponse>(`/projects/${encodedId}/address`, data);
        return response.data;
    },

    // Add Bank Account
    addBankAccount: async (projectId: string, data: Omit<BankAccount, 'id'>): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.post<ProjectResponse>(`/projects/${encodedId}/bank-accounts`, data);
        return response.data;
    },

    // Update Bank Account
    updateBankAccount: async (projectId: string, accountId: string, data: Partial<BankAccount>): Promise<ProjectResponse> => {
        const encodedProjectId = encodeURIComponent(projectId);
        const response = await axiosInstance.put<ProjectResponse>(`/projects/${encodedProjectId}/bank-accounts/${accountId}`, data);
        return response.data;
    },

    // Delete Bank Account
    deleteBankAccount: async (projectId: string, accountId: string): Promise<void> => {
        const encodedProjectId = encodeURIComponent(projectId);
        await axiosInstance.delete(`/projects/${encodedProjectId}/bank-accounts/${accountId}`);
    },

    // Upsert GIS
    upsertGIS: async (projectId: string, data: Omit<GISData, 'id'>): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.put<ProjectResponse>(`/projects/${encodedId}/gis`, data);
        return response.data;
    },

    // Submit Project for Review
    submitProject: async (projectId: string): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.post<ProjectResponse>(`/projects/${encodedId}/submit`);
        return response.data;
    },

    // --- Other Promoters (Co-Promoters) APIs ---

    // List Other Promoters
    getOtherPromoters: async (projectId: string): Promise<any[]> => {
        const encodedId = encodeURIComponent(projectId);
        try {
            const response = await axiosInstance.get<{ success: boolean; data: any[] }>(`/projects/${encodedId}/other-promoters`);
            return response.data.data;
        } catch (error: any) {
            console.error("Failed to fetch other promoters", error);
            return [];
        }
    },

    // Add Other Promoter
    addOtherPromoter: async (projectId: string, data: any): Promise<{ success: boolean; data: any }> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.post(`/projects/${encodedId}/other-promoters`, data);
        return response.data;
    },

    // Update Other Promoter
    updateOtherPromoter: async (projectId: string, promoterId: string, data: any): Promise<{ success: boolean; data: any }> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.put(`/projects/${encodedId}/other-promoters/${promoterId}`, data);
        return response.data;
    },

    // Delete Other Promoter
    deleteOtherPromoter: async (projectId: string, promoterId: string): Promise<void> => {
        const encodedId = encodeURIComponent(projectId);
        await axiosInstance.delete(`/projects/${encodedId}/other-promoters/${promoterId}`);
    },

    // Upsert Bank Details for Other Promoter (Area Share)
    upsertPromoterBankDetails: async (projectId: string, promoterId: string, data: any): Promise<{ success: boolean; data: any }> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.post(`/projects/${encodedId}/other-promoters/${promoterId}/bank-details`, data);
        return response.data;
    },


    // --- Building APIs ---

    // List Buildings
    listBuildings: async (projectId: string): Promise<Building[]> => {
        const encodedId = encodeURIComponent(projectId);
        try {
            const response = await axiosInstance.get<{ success: boolean; data: Building[] }>(`/projects/${encodedId}/buildings`);
            return response.data.data || [];
        } catch (error: any) {
            console.error("Failed to list buildings", error);
            if (error.response?.status === 404) return [];
            return [];
        }
    },

    // Create Building
    createBuilding: async (projectId: string, data: Omit<Building, 'id' | 'projectId'>): Promise<{ success: boolean; data: Building }> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.post(`/projects/${encodedId}/buildings`, data);
        return response.data;
    },

    // Get Building
    getBuilding: async (buildingId: string): Promise<{ success: boolean; data: Building }> => {
        const encodedId = encodeURIComponent(buildingId);
        const response = await axiosInstance.get(`/buildings/${encodedId}`);
        return response.data;
    },

    // Delete Building
    deleteBuilding: async (buildingId: string): Promise<void> => {
        const encodedId = encodeURIComponent(buildingId);
        await axiosInstance.delete(`/buildings/${encodedId}`);
    },

    // --- Common Areas & Facilities APIs ---

    // Get Common Areas
    getCommonAreas: async (projectId: string): Promise<any> => {
        const encodedId = encodeURIComponent(projectId);
        try {
            const response = await axiosInstance.get(`/projects/${encodedId}/common-areas`);
            return response.data;
        } catch (error: any) {
            console.error("Failed to fetch common areas", error);
            if (error.response?.status === 404) {
                // Return default structure if not found
                return {
                    success: true,
                    data: {
                        summary: {
                            openParkingAreaSqm: 0,
                            coveredParkingCount: 0,
                            openParkingUnitsBooked: 0,
                            coveredParkingUnitsBooked: 0,
                            openParkingProgressPercent: 0,
                            coveredParkingProgressPercent: 0
                        },
                        facilities: []
                    }
                };
            }
            throw error;
        }
    },

    // Save Common Areas
    saveCommonAreas: async (projectId: string, data: any): Promise<any> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.put(`/projects/${encodedId}/common-areas`, data);
        return response.data;
    },

    // --- Project Cost APIs ---

    // Get Cost Heads (Metadata)
    getCostHeads: async (): Promise<CostHead[]> => {
        const response = await axiosInstance.get<CostHead[]>(`/project-cost/heads`);
        const data = response.data;
        if (Array.isArray(data)) return data;
        // Fallback for wrapped response
        return (data as any).data || [];
    },

    // Get Project Costs
    getProjectCosts: async (projectId: string): Promise<{ costs: ProjectCost[], totalEstimatedCost?: number, totalActualCost?: number }> => {
        const encodedId = encodeURIComponent(projectId);
        try {
            const response = await axiosInstance.get<SavedCostResponse>(`/projects/${encodedId}/costs`);

            // Handle various possible structures (Flat list or Wrapped)
            const body: any = response.data;
            let costs: ProjectCost[] = [];
            let totalEstimatedCost = 0;
            let totalActualCost = 0;

            if (Array.isArray(body)) {
                costs = body;
            } else if (Array.isArray(body?.costs)) {
                costs = body.costs;
                totalEstimatedCost = body.totalEstimatedCost;
                totalActualCost = body.totalActualCost;
            } else if (Array.isArray(body?.data?.costs)) {
                costs = body.data.costs;
                totalEstimatedCost = body.data.totalEstimatedCost;
                totalActualCost = body.data.totalActualCost;
            } else if (Array.isArray(body?.data)) {
                costs = body.data;
            }

            return { costs, totalEstimatedCost, totalActualCost };

        } catch (error: any) {
            if (error.response?.status === 404) return { costs: [] };
            throw error;
        }
    },

    // Save Project Costs
    saveProjectCosts: async (projectId: string, costs: ProjectCost[]): Promise<any> => {
        const encodedId = encodeURIComponent(projectId);
        // The API expects { costs: [...] }
        const response = await axiosInstance.put(`/projects/${encodedId}/costs`, { costs });
        return response.data;
    },

    // --- Project Documents APIs ---

    // Get Document Types (Metadata)
    getDocumentTypes: async (): Promise<DocumentType[]> => {
        try {
            console.log("DEBUG: Requesting Document Types from /project-document-types");
            const response = await axiosInstance.get<{ success: boolean; data: DocumentType[] }>(`/project-document-types`);
            console.log("DEBUG: getDocumentTypes Response:", response.data);

            // Handle { success: true, data: [...] } structure
            if (Array.isArray(response.data.data)) {
                return response.data.data;
            }

            // Handle flat array just in case
            const data: any = response.data;
            if (Array.isArray(data)) return data;

            return [];
        } catch (err: any) {
            console.error("Failed to fetch document types", err);
            throw err;
        }
    },

    // List Project Documents
    getProjectDocuments: async (projectId: string): Promise<ProjectDocument[]> => {
        const encodedId = encodeURIComponent(projectId);
        try {
            console.log(`DEBUG: Fetching documents for project ${projectId}`);
            const response = await axiosInstance.get<DocumentListResponse>(`/projects/${encodedId}/documents`);
            console.log("DEBUG: getProjectDocuments Response:", response.data);

            const body: any = response.data;
            if (Array.isArray(body)) return body;
            if (Array.isArray(body?.documents)) return body.documents;
            if (Array.isArray(body?.data?.documents)) return body.data.documents;

            return [];
        } catch (error: any) {
            console.error("DEBUG: Failed to fetch documents", error.response?.status, error.message);
            if (error.response?.status === 404) return [];
            throw error;
        }
    },

    // Add Document Row (Metadata)
    addDocumentRow: async (projectId: string, data: { documentTypeCode: string; customDocumentName?: string }): Promise<{ success: boolean; data: { documentId: string } }> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.post<{ success: boolean; data: { documentId: string } }>(`/projects/${encodedId}/documents`, data);
        return response.data;
    },

    // Upload Document File
    uploadDocumentFile: async (projectId: string, documentId: string, file: File): Promise<any> => {
        const encodedProjectId = encodeURIComponent(projectId);
        const encodedDocId = encodeURIComponent(documentId);

        const formData = new FormData();
        formData.append("file", file);

        const response = await axiosInstance.post(`/projects/${encodedProjectId}/documents/${encodedDocId}/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    // Delete Document
    deleteDocument: async (projectId: string, documentId: string): Promise<void> => {
        const encodedProjectId = encodeURIComponent(projectId);
        const encodedDocId = encodeURIComponent(documentId);
        await axiosInstance.delete(`/projects/${encodedProjectId}/documents/${encodedDocId}`);
    },
};

import { CostHead, ProjectCost, SavedCostResponse, DocumentType, ProjectDocument, DocumentListResponse } from "@/types/project";
