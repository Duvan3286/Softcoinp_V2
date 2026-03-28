import api, { getApiResponse, ApiResponse } from "./api";

export interface ViewInfo {
    key: string;
    name: string;
    icon: string;
    category: string;
}

export const permissionsService = {
    /**
     * Obtiene el catálogo de vistas configurables
     */
    async getCatalog(): Promise<ViewInfo[]> {
        const response = await getApiResponse<ViewInfo[]>("/permissions/catalog");
        return response.data;
    },

    /**
     * Obtiene los permisos (ViewKeys) de un usuario específico
     */
    async getUserPermissions(userId: string): Promise<string[]> {
        const response = await getApiResponse<string[]>(`/permissions/${userId}`);
        return response.data;
    },

    /**
     * Actualiza los permisos de un usuario
     */
    async updateUserPermissions(userId: string, viewKeys: string[]): Promise<any> {
        const response = await api.put<ApiResponse<{ message: string }>>(`/permissions/${userId}`, viewKeys);
        return response.data;
    }
};
