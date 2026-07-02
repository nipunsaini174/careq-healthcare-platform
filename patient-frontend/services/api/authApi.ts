import axiosInstance from "./axios";
import type { ApiResponse, AuthTokens, User } from "@/types";

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  abhaId?: string;
}

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
      "/auth/login",
      payload
    );
    if (data.data.tokens.token) {
      localStorage.setItem("healthflow-access-token", data.data.tokens.token);
      localStorage.setItem("healthflow-refresh-token", data.data.tokens.refreshToken || "");
    }
    return data.data;
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(
      "/auth/register",
      payload
    );
    if (data.data.tokens.token) {
      localStorage.setItem("healthflow-access-token", data.data.tokens.token);
      localStorage.setItem("healthflow-refresh-token", data.data.tokens.refreshToken || "");
    }
    return data.data;
  },

  logout: async () => {
    await axiosInstance.post("/auth/logout");
    localStorage.removeItem("healthflow-access-token");
    localStorage.removeItem("healthflow-refresh-token");
  },

  refreshToken: async (refreshToken: string) => {
    const { data } = await axiosInstance.post<ApiResponse<AuthTokens>>("/auth/refresh", {
      refreshToken,
    });
    return data.data;
  },

  getMe: async () => {
    const { data } = await axiosInstance.get<ApiResponse<User>>("/auth/me");
    return data.data;
  },
};
