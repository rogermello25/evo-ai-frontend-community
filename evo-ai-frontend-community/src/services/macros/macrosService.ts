import api from '@/services/core/api';
import { extractData, extractResponse } from '@/utils/apiHelpers';
import authApi from '@/services/core/apiAuth';
import type {
  Macro,
  MacrosResponse,
  MacroResponse,
  MacroDeleteResponse,
  MacroCreateData,
  MacroUpdateData,
  MacroExecuteData,
  MacrosListParams,
} from '@/types/automation';
import type { Inbox } from '@/types/channels/inbox';
import type { User } from '@/types/users/users';
import type { Team } from '@/types/users/teams';
import type { Label } from '@/types/settings/labels';

class MacrosService {
  // List macros with optional parameters
  async getMacros(params?: MacrosListParams): Promise<MacrosResponse> {
    const response = await api.get('/macros', { params });
    return extractResponse<Macro>(response) as MacrosResponse;
  }

  // Get single macro
  async getMacro(macroId: string): Promise<MacroResponse> {
    const response = await api.get(`/macros/${macroId}`);
    return extractData<MacroResponse>(response);
  }

  // Create macro
  async createMacro(data: MacroCreateData): Promise<MacroResponse> {
    const response = await api.post('/macros', data);
    return extractData<MacroResponse>(response);
  }

  // Update macro
  async updateMacro(macroId: string, data: Partial<MacroUpdateData>): Promise<MacroResponse> {
    const response = await api.put(`/macros/${macroId}`, data);
    return extractData<MacroResponse>(response);
  }

  // Delete macro
  async deleteMacro(macroId: string): Promise<MacroDeleteResponse> {
    const response = await api.delete(`/macros/${macroId}`);
    return extractData<MacroDeleteResponse>(response);
  }

  // Execute macro
  async executeMacro(data: MacroExecuteData): Promise<void> {
    await api.post(`/macros/${data.macroId}/execute`, {
      conversation_ids: data.conversationIds,
    });
  }

  // Search macros (if implemented in backend)
  async searchMacros(query: string, params?: MacrosListParams): Promise<MacrosResponse> {
    const searchParams = { ...params, q: query };
    return this.getMacros(searchParams);
  }

  async getFormData(): Promise<{
    inboxes: Inbox[];
    agents: User[];
    teams: Team[];
    labels: Label[];
    campaigns: unknown[];
    customAttributes: unknown[];
  }> {
    try {
      // Buscar dados necessários para o formulário em paralelo
      const [inboxesRes, agentsRes, teamsRes, labelsRes] = await Promise.allSettled([
        api.get('/inboxes'),
        authApi.get('/users'),
        api.get('/teams'),
        api.get('/labels'),
      ]);

      function getResultData<T>(result: PromiseSettledResult<unknown>, isAuthService = false): T[] {
        if (result.status === 'fulfilled') {
          if (isAuthService) {
            const response = extractResponse(result.value as Parameters<typeof extractResponse>[0]);
            return (response.data as T[]) || [];
          }
          const data = extractData<T[] | T>(result.value as Parameters<typeof extractData>[0]);
          return Array.isArray(data) ? data : [];
        }
        return [];
      }

      return {
        inboxes: getResultData<Inbox>(inboxesRes),
        agents: getResultData<User>(agentsRes, true),
        teams: getResultData<Team>(teamsRes),
        labels: getResultData<Label>(labelsRes),
        campaigns: [],
        customAttributes: [],
      };
    } catch (error: unknown) {
      console.error('Erro ao buscar dados do formulário:', error);
      // Retornar dados vazios em caso de erro para não quebrar o formulário
      return {
        inboxes: [],
        agents: [],
        teams: [],
        labels: [],
        campaigns: [],
        customAttributes: [],
      };
    }
  }
}

export const macrosService = new MacrosService();
