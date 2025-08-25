import { AIModel, LMStudioConfig, AIModelResponse, NetworkError, ConfigurationError, ValidationError } from '@/types/ai-models';

/**
 * Repository for LM Studio API interactions
 * Contract:
 * - Inputs: baseUrl for configuration, model operations
 * - Output: Promise<AIModel[]> | Promise<Response> | throws NetworkError | ConfigurationError  
 * - Side effects: HTTP requests to LM Studio API
 */

const DEFAULT_BASE_URL = 'http://localhost:1234';

export class LMStudioRepository {
  private baseUrl: string = DEFAULT_BASE_URL;
  private activeRequests: Map<string, AbortController> = new Map();

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      return true;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new ConfigurationError(`Failed to connect to LM Studio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchModels(): Promise<AIModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new NetworkError(`Failed to fetch models: HTTP ${response.status}`, response.status);
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new ValidationError('Invalid response format from LM Studio API');
      }

      return data.data.map((model: { id: string; size?: number }) => ({
        id: model.id,
        name: model.id,
        size: model.size,
        isEnabled: false, // Default to disabled
        isOnline: true,
      }));
    } catch (error) {
      if (error instanceof NetworkError || error instanceof ValidationError) {
        throw error;
      }
      throw new NetworkError(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendMessage(modelId: string, messages: Array<{ role: string; content: string }>): Promise<Response> {
    try {
      // Create unique request ID and abort controller for this request
      const requestId = `${modelId}-${Date.now()}-${Math.random()}`;
      const abortController = new AbortController();
      
      // Store the abort controller for this specific request
      this.activeRequests.set(requestId, abortController);

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
        body: JSON.stringify({
          model: modelId,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: -1,
        }),
      });

      if (!response.ok) {
        // Check for specific error types
        let errorMessage = `Failed to send message: HTTP ${response.status}`;
        try {
          const errorBody = await response.text();
          const errorData = JSON.parse(errorBody);
          
          // Check for model unloaded errors
          if (errorData.error?.message?.toLowerCase().includes('model') && 
              (errorData.error.message.toLowerCase().includes('unloaded') || 
               errorData.error.message.toLowerCase().includes('not loaded') ||
               errorData.error.message.toLowerCase().includes('not found'))) {
            throw new ConfigurationError(`Model "${modelId}" is not loaded. Please load the model in LM Studio first.`);
          }
          
          errorMessage = errorData.error?.message || errorMessage;
        } catch (parseError) {
          // If we can't parse the error, use the status-based message
        }
        
        throw new NetworkError(errorMessage, response.status);
      }

      // Add request ID to response for cleanup
      (response as any).requestId = requestId;
      return response;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new NetworkError('Request was cancelled');
      }
      throw new NetworkError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  cancelRequest(requestId: string): void {
    const abortController = this.activeRequests.get(requestId);
    if (abortController) {
      abortController.abort();
      this.activeRequests.delete(requestId);
    }
  }

  cancelAllRequests(): void {
    for (const [requestId, abortController] of this.activeRequests) {
      abortController.abort();
    }
    this.activeRequests.clear();
  }

  cleanupRequest(requestId: string): void {
    this.activeRequests.delete(requestId);
  }

  // Helper method to parse streaming response
  async *parseStreamingResponse(response: Response): AsyncGenerator<string, void, unknown> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new NetworkError('No response body available');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    const requestId = (response as any).requestId;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              
              // Check for errors in streaming response
              if (parsed.error) {
                const errorMsg = parsed.error.message || parsed.error;
                if (typeof errorMsg === 'string' && 
                    (errorMsg.toLowerCase().includes('unloaded') || 
                     errorMsg.toLowerCase().includes('not loaded') ||
                     errorMsg.toLowerCase().includes('model not found'))) {
                  throw new ConfigurationError(`Model unloaded during response. Please reload the model in LM Studio.`);
                }
                throw new NetworkError(`Streaming error: ${errorMsg}`);
              }
              
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (error) {
              // Re-throw configuration and network errors
              if (error instanceof ConfigurationError || error instanceof NetworkError) {
                throw error;
              }
              // Skip invalid JSON lines for other parsing errors
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      // Clean up the request from active requests
      if (requestId) {
        this.cleanupRequest(requestId);
      }
    }
  }
}

export const lmStudioRepo = new LMStudioRepository();
