import { axiosInstance, setToken } from "./axios";
import { UserRole } from "@/config/routes";

// Types
export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    scope: any; // Define strictly based on backend if known, else any for now
    projectId?: string; // Added projectId as per backend response
}

export interface AuthResponse {
    accessToken: string;
    user: User;
}

export interface Project {
    id: string;
    name: string;
    status: string;
    [key: string]: any; // Add specific fields as needed
}

export interface Group {
    id: string;
    name: string;
}

export interface Company {
    id: string;
    name: string;
}

// API Client
export const api = {
    // Auth
    login: async (credentials: { projectId: string }) => {
        // Note: The requirement says "POST /auth/login" with "Access token returned".
        // Updated requirement: Body: { "projectId": "...", "password": "..." }
        const response = await axiosInstance.post<AuthResponse>("/auth/login", credentials);
        if (response.data.accessToken) {
            setToken(response.data.accessToken);
        }
        return response.data;
    },

    // Projects
    getMyProjects: async () => {
        // GET /projects/my-projects
        const response = await axiosInstance.get<Project[]>("/projects/my-projects");
        return response.data;
    },

    getProjectById: async (projectId: string) => {
        // Maps to GET /projects/:projectId/sections/promoter-profile
        // as the root /projects/:id doesn't exist.
        // We will adapt the profile response to the Project interface for the dashboard.
        const encodedId = encodeURIComponent(projectId);
        // Using the profile endpoint to get project details
        const response = await axiosInstance.get<any>(`/projects/${encodedId}/sections/promoter-profile`);

        // Map profile data to Project interface
        // Assuming response.data.profile contains the info or response.data is the profile
        const profile = response.data.profile || response.data;

        return {
            id: projectId,
            name: profile.organizationName || profile.firstName + " " + profile.lastName || "Project Name", // Fallback
            status: "Active", // Placeholder, profile might not have status
            location: profile.address?.district || "Unknown",
            description: "Loaded from Profile",
            ...profile // Spread other props
        } as Project;
    },

    createProject: async (data: any) => {
        // POST /projects
        const response = await axiosInstance.post<Project>("/projects", data);
        return response.data;
    },

    updateProject: async (projectId: string, data: any) => {
        // Updates via profile endpoint for now, or specific section?
        // User said: GET /projects/:projectId/sections/promoter-profile (Correct)
        // implying PUT might be same or similar. 
        // For Dashboard 'Edit Project', it likely maps to saving profile data if that's the only endpoint.
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.put<Project>(`/projects/${encodedId}/sections/promoter-profile`, data);
        return response.data;
    },

    // Admin / Groups / Companies
    getGroups: async () => {
        // GET /groups
        const response = await axiosInstance.get<Group[]>("/groups");
        return response.data;
    },

    getGroupById: async (id: string) => {
        const response = await axiosInstance.get<Group>(`/groups/${id}`);
        return response.data;
    },

    createGroup: async (data: any) => {
        const response = await axiosInstance.post<Group>("/groups", data);
        return response.data;
    },

    updateGroup: async (id: string, data: any) => {
        const response = await axiosInstance.put<Group>(`/groups/${id}`, data);
        return response.data;
    },

    getCompanies: async () => {
        // GET /companies
        const response = await axiosInstance.get<Company[]>("/companies");
        return response.data;
    },

    getCompanyById: async (id: string) => {
        const response = await axiosInstance.get<Company>(`/companies/${id}`);
        return response.data;
    },

    createCompany: async (data: any) => {
        const response = await axiosInstance.post<Company>("/companies", data);
        return response.data;
    },

    updateCompany: async (id: string, data: any) => {
        const response = await axiosInstance.put<Company>(`/companies/${id}`, data);
        return response.data;
    },

    // Projects (Admin Search)
    getAllProjects: async () => {
        // GET /projects (Admin only)
        const response = await axiosInstance.get<Project[]>("/projects");
        return response.data;
    },

    // Users (Admin only)
    getUsers: async () => {
        const response = await axiosInstance.get<User[]>("/users");
        return response.data;
    },

    createUser: async (data: any) => {
        const response = await axiosInstance.post<User>("/users", data);
        return response.data;
    },

    // Project Status
    getProjectStatus: async (projectId: string) => {
        const encodedId = encodeURIComponent(projectId);
        const response = await axiosInstance.get<any>(`/projects/${encodedId}/status`);
        return response.data;
    },
};
