import api from "./api";

export interface SystemSetting {
  key: string;
  value: string;
  updatedAt?: string;
}

export const settingsService = {
  getAll: async () => {
    const res = await api.get<SystemSetting[]>("/settings");
    return res.data;
  },

  getByKey: async (key: string) => {
    const res = await api.get<SystemSetting>(`/settings/${key}`);
    return res.data;
  },

  update: async (setting: { key: string; value: string }) => {
    const res = await api.post<SystemSetting>("/settings", setting);
    return res.data;
  },

  getClientName: async () => {
    try {
      const res = await api.get<SystemSetting>("/settings/ClientName");
      return res.data.value;
    } catch {
      return "SISTEMA DE SEGURIDAD";
    }
  },

  getSystemVersion: async () => {
    try {
      const res = await api.get<SystemSetting>("/settings/SystemVersion");
      return res.data.value;
    } catch {
      return ""; // No hardcoded fallback
    }
  }
};
