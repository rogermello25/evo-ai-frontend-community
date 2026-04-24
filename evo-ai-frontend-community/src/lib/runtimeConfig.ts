export interface RuntimeConfig {
  apiUrl: string;
  authApiUrl: string;
  wsUrl: string;
  evoAiApiUrl: string;
  agentProcessorUrl: string;
  evolutionApiUrl: string;
}

declare global {
  interface Window {
    __CONFIG__?: Partial<RuntimeConfig>;
  }
}

export function getConfig(): RuntimeConfig {
  const c = window.__CONFIG__ ?? {};
  return {
    apiUrl:            c.apiUrl            ?? import.meta.env.VITE_API_URL            ?? '',
    authApiUrl:        c.authApiUrl        ?? import.meta.env.VITE_AUTH_API_URL       ?? '',
    wsUrl:             c.wsUrl             ?? import.meta.env.VITE_WS_URL             ?? '',
    evoAiApiUrl:       c.evoAiApiUrl       ?? import.meta.env.VITE_EVOAI_API_URL      ?? '',
    agentProcessorUrl: c.agentProcessorUrl ?? import.meta.env.VITE_AGENT_PROCESSOR_URL ?? '',
    evolutionApiUrl:   c.evolutionApiUrl   ?? import.meta.env.VITE_EVOLUTION_API_URL   ?? '',
  };
}
