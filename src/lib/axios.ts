import axios from "axios";

// Environment variable for API URL or default
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const axiosInstance = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

console.log("🚀 API Configuration:", {
    baseURL,
    envVar: process.env.NEXT_PUBLIC_API_URL
});

// Request interceptor to attach token
axiosInstance.interceptors.request.use(
    (config) => {
        // Token is stored in memory, but for implicit persistence across page reloads
        // in a real app we might use memory+refresh token. 
        // Per requirements: "Store access token in memory (NOT localStorage)"
        // This implies we need a way to inject it. 
        // We will handle injection via the API client wrapper or a variable we export.
        // For now, let's assume `api.ts` manages the token variable or we export a setter.

        const token = getStringToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                // Redirect to login
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            }
            // 403 or 404 handled by caller or global error boundary, 
            // but requirement says "On 403 or 404 -> show 'Not authorized or not found'"
            // We will let the specific component handle the error message display 
            // or use a global toast if appropriate.
        }
        return Promise.reject(error);
    }
);

let memoryToken: string | null = null;

export const setToken = (token: string | null) => {
    memoryToken = token;
};

const getStringToken = () => memoryToken;
