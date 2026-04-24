import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { applySetupInterceptor } from '@/services/core/setupInterceptor';
import apiAuth from '@/services/core/apiAuth';
import { logError } from '@/utils/telemetry';

const agentProcessorApi = axios.create({
  baseURL: `${import.meta.env.VITE_AGENT_PROCESSOR_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: Error | null, token: string | null = null) {
  failedQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
}

agentProcessorApi.interceptors.request.use(config => {
  const authHeader = useAuthStore.getState().getAuthHeader();
  if (authHeader) {
    config.headers.Authorization = authHeader.Authorization;
  }
  return config;
});

agentProcessorApi.interceptors.response.use(
  response => response,
  async error => {
    const detail =
      error?.response?.data?.error?.message ||
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Unknown error';
    logError('AgentProcessorAPI', new Error(detail), { status: error?.response?.status });

    const originalRequest = (error as AxiosError).config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          const authHeader = useAuthStore.getState().getAuthHeader();
          if (authHeader && originalRequest.headers) {
            originalRequest.headers.Authorization = authHeader.Authorization;
          }
          return agentProcessorApi(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await apiAuth.post('/auth/refresh');
        const refreshData = refreshResponse.data?.data || refreshResponse.data;
        const newAccessToken = refreshData?.access_token || refreshData?.token?.access_token;

        if (!newAccessToken) throw new Error('New token not received');

        useAuthStore.getState().setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        isRefreshing = false;
        return agentProcessorApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

applySetupInterceptor(agentProcessorApi);

export { agentProcessorApi };
export default agentProcessorApi;
