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
} from "@/types/project";

export const projectApi = {
    // Create a new project
    createProject: async (profileId: string, data: CreateProjectRequest): Promise<ProjectResponse> => {
        const encodedId = encodeURIComponent(profileId);
        const response = await axiosInstance.post<ProjectResponse>(`/profile/${encodedId}/projects`, data);
        return response.data;
    },

    // List all projects for a profile
    listProjects: async (profileId: string): Promise<Project[]> => {
        const encodedId = encodeURIComponent(profileId);
        try {
            const response = await axiosInstance.get<ProjectListResponse>(`/profile/${encodedId}/projects`);
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
};
