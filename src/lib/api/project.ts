// Project API Functions
import { axiosInstance } from "../axios";
import {
    Project,
    ProjectResponse,
    ProjectListResponse,
    CreateProjectRequest,
    LandDetail,
    BuiltupDetail,
    ProjectAddress,
    BankAccount,
    GISData,
    Building,
} from "@/types/project";

export const projectApi = {
    // Create a new project
    createProject: async (profileId: string, data: CreateProjectRequest): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(profileId);
        const response = await axiosInstance.post<ProjectResponse>(`/profile/${encodedId}/projects`, data);
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
};
