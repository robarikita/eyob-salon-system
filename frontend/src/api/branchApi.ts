const API_BASE = '/api/v1';

export interface BranchDTO {
  id: string;
  name: string;
  slug?: string;
  phoneNumber?: string;
  addressLine?: string;
  city?: string;
  description?: string | null;
  timezone?: string;
  isActive?: boolean;
  phone?: string;
  address?: string;
  subtitle?: string;
}

export const branchApi = {
  async listBranches(): Promise<BranchDTO[]> {
    const res = await fetch(`${API_BASE}/branches`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch branches');
    }
    return data.data || [];
  },

  async getBranch(id: string): Promise<BranchDTO> {
    const res = await fetch(`${API_BASE}/branches/${id}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch branch details');
    }
    return data.data;
  },
};
