import { LMStudioConfig, AIModel } from '@/types/ai-models';

/**
 * Service for managing local storage preferences
 * Contract:
 * - Inputs: config object, model preferences
 * - Output: saved/retrieved configuration and preferences
 * - Errors: none (graceful fallback to defaults)
 * - Side effects: localStorage read/write operations
 */

const STORAGE_KEYS = {
  LM_STUDIO_CONFIG: 'lm_studio_config',
  MODEL_PREFERENCES: 'model_preferences',
} as const;

export class StorageService {
  private isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage != null;
    } catch {
      return false;
    }
  }

  // Configuration management
  saveConfig(config: LMStudioConfig): void {
    if (!this.isAvailable()) return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.LM_STUDIO_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save LM Studio configuration:', error);
    }
  }

  getConfig(): LMStudioConfig {
    if (!this.isAvailable()) {
      return {
        baseUrl: 'http://localhost:1234',
        isConfigured: false,
        retrySettings: {
          enabled: true,
          maxRetries: 2,
          retryDelay: 2000,
          retryStrategy: 'fixed',
          retryOnlyModelErrors: true,
        },
      };
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LM_STUDIO_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure retry settings exist with defaults
        return {
          ...parsed,
          retrySettings: {
            enabled: true,
            maxRetries: 2,
            retryDelay: 2000,
            retryStrategy: 'fixed',
            retryOnlyModelErrors: true,
            ...parsed.retrySettings,
          },
        };
      }
    } catch (error) {
      console.warn('Failed to load config:', error);
    }

    return {
      baseUrl: 'http://localhost:1234',
      isConfigured: false,
      retrySettings: {
        enabled: true,
        maxRetries: 2,
        retryDelay: 2000,
        retryStrategy: 'fixed',
        retryOnlyModelErrors: true,
      },
    };
  }

  // Model preferences management
  saveModelPreferences(models: Pick<AIModel, 'id' | 'isEnabled' | 'useHistory'>[]): void {
    if (!this.isAvailable()) return;

    try {
      const preferences = models.reduce((acc, model) => {
        acc[model.id] = { 
          isEnabled: model.isEnabled,
          useHistory: model.useHistory ?? false
        };
        return acc;
      }, {} as Record<string, { isEnabled: boolean; useHistory: boolean }>);

      localStorage.setItem(STORAGE_KEYS.MODEL_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save model preferences:', error);
    }
  }

  getModelPreferences(): Record<string, { isEnabled: boolean; useHistory: boolean }> {
    if (!this.isAvailable()) return {};

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MODEL_PREFERENCES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load model preferences:', error);
    }

    return {};
  }

  // Apply saved preferences to models
  applyPreferencesToModels(models: AIModel[]): AIModel[] {
    const preferences = this.getModelPreferences();
    
    return models.map(model => ({
      ...model,
      isEnabled: preferences[model.id]?.isEnabled ?? false,
      useHistory: preferences[model.id]?.useHistory ?? false,
    }));
  }

  // Clear all data
  clearAll(): void {
    if (!this.isAvailable()) return;

    try {
      localStorage.removeItem(STORAGE_KEYS.LM_STUDIO_CONFIG);
      localStorage.removeItem(STORAGE_KEYS.MODEL_PREFERENCES);
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }
}

export const storageService = new StorageService();
