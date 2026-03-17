import { getApiResponse } from "./api";

export interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  data: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  total: number;
  page: number;
  pageSize: number;
  logs: AuditLog[];
}

export const auditService = {
  getLogs: async (params?: { 
    page?: number; 
    pageSize?: number;
    action?: string;
    desde?: string;
    hasta?: string;
  }): Promise<AuditLogsResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.pageSize) query.append("pageSize", params.pageSize.toString());
    if (params?.action) query.append("action", params.action);
    if (params?.desde) query.append("desde", params.desde);
    if (params?.hasta) query.append("hasta", params.hasta);
    
    const response = await getApiResponse<AuditLogsResponse>(`/auditlogs?${query.toString()}`);
    return response.data;
  }
};
