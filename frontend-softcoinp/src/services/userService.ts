import api, { getApiResponse, ApiResponse } from "./api";

export interface User {
  id: string;
  email: string;
  nombre: string;
  role: string;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  nombre: string;
  password?: string;
  role?: string;
}

export interface UpdateUserDto {
  email?: string;
  nombre?: string;
  password?: string;
  role?: string;
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await getApiResponse<User[]>("/users");
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await getApiResponse<User>(`/users/${id}`);
    return response.data;
  },

  createUser: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post<ApiResponse<User>>("/users", data);
    return response.data.data;
  },

  updateUser: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  resetPassword: async (id: string, newPassword?: string): Promise<{ message: string; temporaryPassword?: string }> => {
    const response = await api.post<ApiResponse<{ message: string; temporaryPassword?: string }>>(`/users/${id}/reset-password`, { newPassword });
    return response.data.data; // Retorna el mensaje y password si se genró auto
  },
};
