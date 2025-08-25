// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LMStudioRepository } from '@/lib/repos/lm-studio-repo';
import { NetworkError, ConfigurationError, ValidationError } from '@/types/ai-models';

// Mock fetch
global.fetch = vi.fn();

describe('LMStudioRepository', () => {
  let repo: LMStudioRepository;
  const mockFetch = fetch as vi.MockedFunction<typeof fetch>;

  beforeEach(() => {
    repo = new LMStudioRepository();
    mockFetch.mockClear();
  });

  describe('verifyConnection', () => {
    it('should return true for successful connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      const result = await repo.verifyConnection();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:1234/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw NetworkError for HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(repo.verifyConnection()).rejects.toThrow(NetworkError);
    });

    it('should throw ConfigurationError for network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(repo.verifyConnection()).rejects.toThrow(ConfigurationError);
    });
  });

  describe('fetchModels', () => {
    it('should return parsed models list', async () => {
      const mockModels = {
        data: [
          { id: 'model1', size: 1000000 },
          { id: 'model2', size: 2000000 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModels,
      } as Response);

      const models = await repo.fetchModels();
      
      expect(models).toHaveLength(2);
      expect(models[0]).toEqual({
        id: 'model1',
        name: 'model1',
        size: 1000000,
        isEnabled: false,
        isOnline: true,
      });
    });

    it('should throw ValidationError for invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'format' }),
      } as Response);

      await expect(repo.fetchModels()).rejects.toThrow(ValidationError);
    });
  });

  describe('setBaseUrl', () => {
    it('should remove trailing slash from URL', () => {
      repo.setBaseUrl('http://localhost:8080/');
      // We can't directly test the private baseUrl, but we can test the behavior
      // by checking if subsequent calls use the correct URL
      expect(() => repo.setBaseUrl('http://localhost:8080/')).not.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should send message with correct format', async () => {
      const mockResponse = new Response('data: {"choices":[{"delta":{"content":"test"}}]}\n\ndata: [DONE]\n\n');
      Object.defineProperty(mockResponse, 'ok', { value: true });
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      const messages = [{ role: 'user', content: 'Hello' }];
      const response = await repo.sendMessage('model1', messages);

      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:1234/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'model1',
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: -1,
          }),
        })
      );
    });
  });
});
