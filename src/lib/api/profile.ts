// Profile API functions - separate file for clarity
import { axiosInstance } from "../axios";
import {
    Profile,
    ProfileResponse,
    PastExperience,
    OrgMember,
    District,
    Mandal,
    Village,
    Designation,
    OtherMember,
} from "@/types/profile";

export const profileApi = {
    // Fetch designations for an organization type
    getDesignations: async (orgType: string): Promise<Designation[]> => {
        const response = await axiosInstance.get<{ designations: Designation[] }>(`/designations/${orgType}`);
        return response.data.designations;
    },

    // Get current user's profile
    getProfile: async (projectId: string): Promise<ProfileResponse> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.get<ProfileResponse>(`/projects/${encodedId}/sections/promoter-profile`);
        return response.data;
    },

    // Save profile (draft or complete)
    saveProfile: async (projectId: string, data: Profile): Promise<ProfileResponse> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.put<ProfileResponse>(`/projects/${encodedId}/sections/promoter-profile`, data);
        return response.data;
    },

    // Past Experience CRUD (API: /profiles/:identifier/past-experiences)
    getPastExperiences: async (identifier: string): Promise<PastExperience[]> => {
        const encodedId = encodeURIComponent(identifier);
        try {
            const response = await axiosInstance.get<PastExperience[]>(`/profiles/${encodedId}/past-experiences`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) return [];
            throw error;
        }
    },

    addPastExperience: async (identifier: string, data: Omit<PastExperience, "id">): Promise<PastExperience> => {
        const encodedId = encodeURIComponent(identifier);
        const response = await axiosInstance.post<PastExperience>(`/profiles/${encodedId}/past-experiences`, data);
        return response.data;
    },

    updatePastExperience: async (identifier: string, id: string, data: Partial<PastExperience>): Promise<PastExperience> => {
        const encodedId = encodeURIComponent(identifier);
        const response = await axiosInstance.put<PastExperience>(`/profiles/${encodedId}/past-experiences/${id}`, data);
        return response.data;
    },

    deletePastExperience: async (identifier: string, id: string): Promise<void> => {
        const encodedId = encodeURIComponent(identifier);
        await axiosInstance.delete(`/profiles/${encodedId}/past-experiences/${id}`);
    },

    // Organization Member CRUD
    getOrgMembers: async (projectId: string): Promise<OrgMember[]> => {
        const encodedId = encodeURIComponent(projectId);
        try {
            const response = await axiosInstance.get<OrgMember[]>(`/projects/${encodedId}/sections/promoter-profile/org-members`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return [];
            }
            throw error;
        }
    },

    addOrgMember: async (projectId: string, data: Omit<OrgMember, "id">): Promise<OrgMember> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.post<OrgMember>(`/projects/${encodedId}/sections/promoter-profile/org-members`, data);
        return response.data;
    },

    updateOrgMember: async (projectId: string, id: string, data: Partial<OrgMember>): Promise<OrgMember> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.put<OrgMember>(`/projects/${encodedId}/sections/promoter-profile/org-members/${id}`, data);
        return response.data;
    },

    deleteOrgMember: async (projectId: string, id: string): Promise<void> => {
        const encodedId = encodeURIComponent(projectId);
        await axiosInstance.delete(`/projects/${encodedId}/sections/promoter-profile/org-members/${id}`);
    },

    // Other Members (for OrganizationType = 'OTHERS')
    getOtherMembers: async (projectId: string): Promise<OtherMember[]> => {
        const encodedId = encodeURIComponent(projectId);
        try {
            const response = await axiosInstance.get<OtherMember[]>(`/organizations/${encodedId}/other-members`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) return [];
            throw error;
        }
    },

    addOtherMember: async (projectId: string, data: Omit<OtherMember, "id">): Promise<OtherMember> => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.post<OtherMember>(`/organizations/${encodedId}/other-members`, data);
        return response.data;
    },

    updateOtherMember: async (memberId: string, data: Partial<OtherMember>): Promise<OtherMember> => {
        const response = await axiosInstance.put<OtherMember>(`/other-members/${memberId}`, data);
        return response.data;
    },

    deleteOtherMember: async (memberId: string): Promise<void> => {
        await axiosInstance.delete(`/other-members/${memberId}`);
    },

    // Location data (for cascading dropdowns)
    getDistricts: async (): Promise<District[]> => {
        const response = await axiosInstance.get<{ districts: District[] }>(`/locations/districts`);
        return response.data.districts;
    },

    getMandals: async (districtId: string): Promise<Mandal[]> => {
        const response = await axiosInstance.get<{ mandals: Mandal[] }>(`/locations/districts/${districtId}/mandals`);
        return response.data.mandals;
    },

    getVillages: async (mandalId: string): Promise<Village[]> => {
        const response = await axiosInstance.get<{ villages: Village[] }>(`/locations/mandals/${mandalId}/villages`);
        return response.data.villages;
    },

    // Upload profile image
    uploadProfileImage: async (projectId: string, file: File): Promise<{ url: string }> => {
        const encodedId = encodeURIComponent(projectId);
        const formData = new FormData();
        formData.append("file", file);
        const response = await axiosInstance.post<{ url: string }>(`/projects/${encodedId}/sections/promoter-profile/upload-image`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },
};
