/**
 * Contract for AI Models Feature
 * - Inputs: LM Studio API base URL, model selection, prompt with optional attachments
 * - Output: Streamed responses from enabled AI models
 * - Errors: NetworkError, ValidationError, ConfigurationError
 * - Side effects: localStorage for preferences, network requests to LM Studio API
 */

export interface AIModel {
  id: string;
  name: string;
  size?: number;
  isEnabled: boolean;
  isOnline?: boolean;
  useHistory?: boolean; // Whether to include conversation history in requests
}

export interface AIModelResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  modelIds: string[]; // Which models participated in this conversation
}

export interface ModelConversation {
  modelId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
  retryCount?: number;
  canRetry?: boolean;
  lastFailedPrompt?: PromptData;
}

export interface LMStudioConfig {
  baseUrl: string;
  isConfigured: boolean;
  retrySettings?: RetrySettings;
}

export interface RetrySettings {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number; // in milliseconds
  retryStrategy: 'immediate' | 'exponential' | 'fixed';
  retryOnlyModelErrors: boolean; // if false, retry all errors
}

export interface AttachmentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer;
}

export interface PromptData {
  text: string;
  attachments: AttachmentFile[];
}

// Error types
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
