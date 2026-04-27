import api from '@/services/core/api';
import type {
  GoogleCalendarConfig,
  GoogleCalendarItem,
  GoogleCalendarOAuthResponse,
  GoogleCalendarConnectionResponse
} from '@/types/integrations';

// Processor wraps responses in { success, data: {...}, meta, message }.
// Unwrap to the inner payload here so callers see the documented shape.
function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    const inner = (body as { data: unknown }).data;
    if (inner !== undefined && inner !== null) return inner as T;
  }
  return body as T;
}

const GoogleCalendarService = {
  /**
   * Generate Google Calendar OAuth authorization URL
   */
  async generateAuthorization(agentId: string, email?: string): Promise<GoogleCalendarOAuthResponse> {
    try {
      const { data } = await api.post(
        `/agents/${agentId}/integrations/google-calendar/authorization`,
        { email }
      );
      return unwrap<GoogleCalendarOAuthResponse>(data);
    } catch (error) {
      console.error('GoogleCalendarService.generateAuthorization error:', error);
      throw error;
    }
  },

  /**
   * Complete Google Calendar OAuth flow and get calendars
   */
  async completeAuthorization(
    agentId: string,
    code: string,
    state: string
  ): Promise<GoogleCalendarConnectionResponse> {
    try {
      const { data } = await api.post(
        `/agents/${agentId}/integrations/google-calendar/callback`,
        {
          code,
          state,
        }
      );
      const inner = unwrap<Omit<GoogleCalendarConnectionResponse, 'success'>>(data);
      // Processor's success_response envelope has success:true at the outer level;
      // the inner `data` does not carry it. Propagate it so CallbackPage's contract is honored.
      return { success: true, ...inner } as GoogleCalendarConnectionResponse;
    } catch (error) {
      console.error('GoogleCalendarService.completeAuthorization error:', error);
      throw error;
    }
  },

  /**
   * Get list of available calendars
   */
  async getCalendars(agentId: string): Promise<GoogleCalendarItem[]> {
    try {
      const { data } = await api.get(
        `/agents/${agentId}/integrations/google-calendar/calendars`
      );
      const inner = unwrap<{ calendars?: GoogleCalendarItem[] }>(data);
      return inner.calendars || [];
    } catch (error) {
      console.error('GoogleCalendarService.getCalendars error:', error);
      throw error;
    }
  },

  /**
   * Save Google Calendar configuration
   */
  async saveConfiguration(
    agentId: string,
    config: Partial<GoogleCalendarConfig>
  ): Promise<{ success: boolean }> {
    try {
      const { data } = await api.put(
        `/agents/${agentId}/integrations/google-calendar`,
        config
      );
      return unwrap<{ success: boolean }>(data);
    } catch (error) {
      console.error('GoogleCalendarService.saveConfiguration error:', error);
      throw error;
    }
  },

  /**
   * Disconnect Google Calendar
   */
  async disconnect(agentId: string): Promise<{ success: boolean }> {
    try {
      const { data } = await api.delete(
        `/agents/${agentId}/integrations/google-calendar`
      );
      return unwrap<{ success: boolean }>(data);
    } catch (error) {
      console.error('GoogleCalendarService.disconnect error:', error);
      throw error;
    }
  },

  /**
   * Check availability for a specific date/time
   */
  async checkAvailability(
    agentId: string,
    params: {
      calendarId: string;
      start: string; // ISO date
      end: string; // ISO date
    }
  ): Promise<{ available: boolean; slots?: Array<{ start: string; end: string }> }> {
    try {
      const { data } = await api.post(
        `/agents/${agentId}/integrations/google-calendar/availability`,
        params
      );
      return unwrap<{ available: boolean; slots?: Array<{ start: string; end: string }> }>(data);
    } catch (error) {
      console.error('GoogleCalendarService.checkAvailability error:', error);
      throw error;
    }
  },

  /**
   * Create a calendar event
   */
  async createEvent(
    agentId: string,
    event: {
      calendarId: string;
      summary: string;
      description?: string;
      start: string; // ISO date
      end: string; // ISO date
      attendees?: Array<{ email: string; name?: string }>;
      meetLink?: boolean;
    }
  ): Promise<{ success: boolean; eventId?: string; meetLink?: string }> {
    try {
      const { data } = await api.post(
        `/agents/${agentId}/integrations/google-calendar/events`,
        event
      );
      return unwrap<{ success: boolean; eventId?: string; meetLink?: string }>(data);
    } catch (error) {
      console.error('GoogleCalendarService.createEvent error:', error);
      throw error;
    }
  },

  /**
   * Get OAuth callback URL for the current domain
   */
  getOAuthCallbackUrl(): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/oauth/google-calendar/callback`;
  },
};

export default GoogleCalendarService;
