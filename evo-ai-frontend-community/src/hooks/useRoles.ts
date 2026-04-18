import { useState, useEffect, useCallback } from 'react';
import { Role } from '@/types/auth';
import { fetchRoles, fetchRolesFull } from '@/services/rbac';

interface UseRolesOptions {
  autoLoad?: boolean;
  loadFull?: boolean;
  type?: 'user' | 'account';
}

export default function useRoles(options: UseRolesOptions = {}) {
  const { autoLoad = true, loadFull = false, type } = options;

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRolesData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = type ? { type } : undefined;
      const response = loadFull ? await fetchRolesFull(filters) : await fetchRoles(filters);

      // fetchRoles returns { success, data: Role[], meta, message }
      // extractResponse wraps the data in response.data
      // So response.data.data is the actual Role[] array
      let extractedRoles: Role[] = [];

      if (loadFull) {
        // fetchRolesFull returns directly the data (not wrapped)
        if (Array.isArray(response)) {
          extractedRoles = response;
        } else if (response && typeof response === 'object') {
          extractedRoles = (response as any).data || (response as any).roles || [];
        }
      } else {
        // fetchRoles returns { success, data: Role[], meta, message } via extractResponse
        // So response.data is the Role[] array
        if (Array.isArray(response)) {
          extractedRoles = response;
        } else if (response && typeof response === 'object') {
          // response.data is the Role[] array from extractResponse
          extractedRoles = (response as any).data?.data || (response as any).data || [];
        }
      }

      setRoles(extractedRoles);
    } catch (error) {
      console.error('Erro ao buscar roles:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [loadFull, type]);

  useEffect(() => {
    if (autoLoad) {
      fetchRolesData();
    }
  }, [autoLoad, fetchRolesData]);

  return {
    roles,
    loading,
    error,
    refetch: fetchRolesData,
  };
}
