export type AIProviderId = 'openai' | 'deepseek' | 'qwen' | 'zhipu' | 'moonshot';
export type DataProviderId = 'brave' | 'hunter';

export type ProviderStatus = {
  id: AIProviderId | DataProviderId;
  name: string;
  category: 'ai' | 'discovery';
  configured: boolean;
  keyName: string;
  model?: string;
  baseUrl?: string;
  consoleUrl: string;
  docsUrl: string;
  canTest: boolean;
};

export type ConnectionTestResult = {
  providerId: AIProviderId;
  ok: boolean;
  durationMs: number;
  message: string;
};
