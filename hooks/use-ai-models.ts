'use client';

import { useState, useEffect, useCallback } from 'react';
import { AIModel, LMStudioConfig, ModelConversation, ChatMessage, PromptData, Conversation, NetworkError, ConfigurationError, RetrySettings } from '@/types/ai-models';
import { lmStudioRepo } from '@/lib/repos/lm-studio-repo';
import { storageService } from '@/lib/services/storage-service';
import { conversationService } from '@/lib/services/conversation-service';

/**
 * Hook for managing AI models and conversations
 * Contract:
 * - Inputs: none (manages internal state)
 * - Output: models state, conversation state, action methods
 * - Errors: handled internally with error state
 * - Side effects: localStorage updates, network requests
 */

export interface UseAIModelsReturn {
  // Configuration
  config: LMStudioConfig;
  isConfigured: boolean;
  
  // Models
  models: AIModel[];
  enabledModels: AIModel[];
  
  // Conversations
  conversations: Record<string, ModelConversation>;
  allConversations: Conversation[];
  activeConversationId: string | null;
  
  // Loading states
  isLoadingModels: boolean;
  isVerifyingConnection: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  verifyAndSaveConfig: (baseUrl: string) => Promise<boolean>;
  updateRetrySettings: (retrySettings: RetrySettings) => void;
  fetchModels: () => Promise<void>;
  toggleModel: (modelId: string, enabled: boolean) => void;
  toggleModelHistory: (modelId: string, useHistory: boolean) => void;
  sendPromptToEnabledModels: (prompt: PromptData) => Promise<void>;
  retryFailedModel: (modelId: string) => Promise<void>;
  clearConversation: (modelId: string) => void;
  clearAllConversations: () => void;
  
  // Conversation management
  createNewConversation: () => void;
  selectConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
}

export function useAIModels(): UseAIModelsReturn {
  // Client-side hydration state
  const [mounted, setMounted] = useState(false);
  
  // Configuration state
  const [config, setConfig] = useState<LMStudioConfig>({
    baseUrl: 'http://localhost:1234',
    isConfigured: false,
  });
  
  // Models state
  const [models, setModels] = useState<AIModel[]>([]);
  const [conversations, setConversations] = useState<Record<string, ModelConversation>>({});
  
  // Conversation management
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  // Loading states
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isVerifyingConnection, setIsVerifyingConnection] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Initialize client-side only data after mounting
  useEffect(() => {
    setMounted(true);
    // Only load from localStorage after mounting to prevent hydration mismatch
    const savedConfig = storageService.getConfig();
    setConfig(savedConfig);
    
    const savedConversations = conversationService.getAllConversations();
    setAllConversations(savedConversations);
    
    const savedActiveId = conversationService.getActiveConversationId();
    setActiveConversationId(savedActiveId);
    
    // If we have conversations but no active one, select the most recent
    if (savedConversations.length > 0 && !savedActiveId) {
      const mostRecent = savedConversations.sort((a, b) => b.updatedAt - a.updatedAt)[0];
      conversationService.setActiveConversation(mostRecent.id);
      setActiveConversationId(mostRecent.id);
    }
  }, []);

  // Derived state
  const isConfigured = mounted && config.isConfigured;
  const enabledModels = models.filter(model => model.isEnabled);

  // Load models on configuration change (only after mounting)
  useEffect(() => {
    if (mounted && isConfigured) {
      fetchModels();
    }
  }, [mounted, isConfigured]); // fetchModels is stable due to useCallback

  // Initialize conversations for new models
  useEffect(() => {
    const newConversations: Record<string, ModelConversation> = {};
    
    models.forEach(model => {
      if (!conversations[model.id]) {
        newConversations[model.id] = {
          modelId: model.id,
          messages: [],
          isLoading: false,
        };
      }
    });

    if (Object.keys(newConversations).length > 0) {
      setConversations(prev => ({ ...prev, ...newConversations }));
    }
  }, [models, conversations]);

  // Create initial conversation if none exists (but only after mounting and if needed)
  useEffect(() => {
    if (mounted && allConversations.length === 0 && !activeConversationId) {
      const newConv = conversationService.createConversation();
      setActiveConversationId(newConv.id);
      setAllConversations([newConv]);
    }
  }, [mounted, allConversations.length, activeConversationId]);

  // Load conversation messages when activeConversationId changes or on mount
  // Note: We don't include 'models' in the dependency array to prevent reloading
  // conversations when models are enabled/disabled, which would cause contamination
  useEffect(() => {
    if (mounted && activeConversationId && models.length > 0) {
      const conversation = conversationService.getConversation(activeConversationId);
      if (conversation) {
        setConversations(prev => {
          const updated: Record<string, ModelConversation> = {};
          models.forEach(model => {
            // Filter messages for this model (user messages + assistant messages from this model)
            const modelMessages = conversation.messages.filter(msg => 
              msg.role === 'user' || msg.modelId === model.id
            );
            
            updated[model.id] = {
              modelId: model.id,
              messages: modelMessages,
              error: undefined,
              isLoading: false,
              retryCount: 0,
              canRetry: false,
            };
          });
          return updated;
        });
      }
    }
  }, [mounted, activeConversationId]); // Removed 'models' dependency to prevent conversation contamination

  const verifyAndSaveConfig = useCallback(async (baseUrl: string): Promise<boolean> => {
    setIsVerifyingConnection(true);
    setError(null);

    try {
      lmStudioRepo.setBaseUrl(baseUrl);
      await lmStudioRepo.verifyConnection();
      
      const newConfig: LMStudioConfig = {
        baseUrl,
        isConfigured: true,
        retrySettings: config.retrySettings,
      };
      
      setConfig(newConfig);
      storageService.saveConfig(newConfig);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify connection';
      setError(errorMessage);
      return false;
    } finally {
      setIsVerifyingConnection(false);
    }
  }, []);

  const fetchModels = useCallback(async (): Promise<void> => {
    if (!isConfigured) return;

    setIsLoadingModels(true);
    setError(null);

    try {
      const fetchedModels = await lmStudioRepo.fetchModels();
      const modelsWithPreferences = storageService.applyPreferencesToModels(fetchedModels);
      setModels(modelsWithPreferences);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
    } finally {
      setIsLoadingModels(false);
    }
  }, [isConfigured]);

  const toggleModel = useCallback((modelId: string, enabled: boolean): void => {
    setModels(prev => {
      const updated = prev.map(model => 
        model.id === modelId ? { ...model, isEnabled: enabled } : model
      );
      
      // Save preferences to localStorage
      storageService.saveModelPreferences(updated);
      
      return updated;
    });
  }, []);

  const toggleModelHistory = useCallback((modelId: string, useHistory: boolean): void => {
    setModels(prev => {
      const updated = prev.map(model => 
        model.id === modelId ? { ...model, useHistory } : model
      );
      
      // Save preferences to localStorage
      storageService.saveModelPreferences(updated);
      
      return updated;
    });
  }, []);

  const updateRetrySettings = useCallback((retrySettings: RetrySettings): void => {
    const newConfig: LMStudioConfig = {
      ...config,
      retrySettings,
    };
    
    setConfig(newConfig);
    storageService.saveConfig(newConfig);
  }, [config]);

  const retryFailedModel = useCallback(async (modelId: string): Promise<void> => {
    const conversation = conversations[modelId];
    if (!conversation?.lastFailedPrompt) {
      return;
    }

    const model = models.find(m => m.id === modelId);
    if (!model || !model.isEnabled) {
      return;
    }

    // Clear previous error and reset retry state
    setConversations(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        isLoading: true,
        error: undefined,
        canRetry: false,
        retryCount: 0,
      },
    }));

    // Retry the failed prompt for just this model
    await sendPromptToModels([model], conversation.lastFailedPrompt);
  }, [conversations, models]);

  const sendPromptToModels = useCallback(async (targetModels: AIModel[], prompt: PromptData): Promise<void> => {
    // Get the current active conversation ID at the time of sending
    const currentActiveId = activeConversationId;
    if (!currentActiveId) {
      setError('No active conversation');
      return;
    }

    const retrySettings = config.retrySettings || {
      enabled: true,
      maxRetries: 2,
      retryDelay: 2000,
      retryStrategy: 'fixed',
      retryOnlyModelErrors: true,
    };

    // Helper function to calculate retry delay
    const getRetryDelay = (retryCount: number): number => {
      switch (retrySettings.retryStrategy) {
        case 'exponential':
          return retrySettings.retryDelay * Math.pow(2, retryCount);
        case 'immediate':
          return 0;
        case 'fixed':
        default:
          return retrySettings.retryDelay;
      }
    };

    // Helper function to determine if we should retry this error
    const shouldRetryError = (error: any): boolean => {
      if (!retrySettings.enabled) return false;
      
      if (retrySettings.retryOnlyModelErrors) {
        return error instanceof ConfigurationError && 
               error.message.toLowerCase().includes('not loaded');
      }
      
      return true; // Retry all errors if retryOnlyModelErrors is false
    };

    // Send to each target model
    const sendPromises = targetModels.map(async (model) => {
      let retryCount = 0;
      const maxRetries = retrySettings.maxRetries;
      
      while (retryCount <= maxRetries) {
        try {
          let apiMessages: Array<{ role: string; content: string }> = [];
          
          // Include conversation history if the model has useHistory enabled
          if (model.useHistory && currentActiveId) {
            const conversationHistory = conversationService.getConversationHistory(currentActiveId, model.id);
            apiMessages = conversationHistory.map(msg => ({
              role: msg.role,
              content: msg.content,
            }));
          } else {
            apiMessages = [{ role: 'user', content: prompt.text }];
          }

          const response = await lmStudioRepo.sendMessage(model.id, apiMessages);
          
          // Handle streaming response
          let assistantMessage = '';
          const streamingParser = lmStudioRepo.parseStreamingResponse(response);
          
          for await (const chunk of streamingParser) {
            assistantMessage += chunk;
            
            // Update conversation with partial response
            setConversations(prev => {
              const updated = { ...prev };
              if (updated[model.id]) {
                const messages = [...updated[model.id].messages];
                const lastMessage = messages[messages.length - 1];
                
                if (lastMessage && lastMessage.role === 'assistant' && lastMessage.modelId === model.id) {
                  // Update existing assistant message
                  messages[messages.length - 1] = {
                    ...lastMessage,
                    content: assistantMessage,
                  };
                } else {
                  // Add new assistant message
                  messages.push({
                    role: 'assistant',
                    content: assistantMessage,
                    timestamp: Date.now(),
                    modelId: model.id,
                  });
                }
                
                updated[model.id] = {
                  ...updated[model.id],
                  messages,
                  isLoading: false,
                  error: undefined,
                  canRetry: false,
                  retryCount: 0,
                };
              }
              return updated;
            });
          }

          // Save final assistant message to conversation
          if (assistantMessage && currentActiveId) {
            const finalAssistantMessage: ChatMessage = {
              role: 'assistant',
              content: assistantMessage,
              timestamp: Date.now(),
              modelId: model.id,
            };
            conversationService.addMessageToConversation(currentActiveId, finalAssistantMessage);
          }
          
          // Success - break out of retry loop
          break;

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
          const shouldRetry = shouldRetryError(err);
          
          // If we should retry and have retries left
          if (shouldRetry && retryCount < maxRetries) {
            retryCount++;
            
            // Show temporary retry message
            setConversations(prev => {
              const updated = { ...prev };
              if (updated[model.id]) {
                updated[model.id] = {
                  ...updated[model.id],
                  isLoading: true,
                  error: `Retrying... (${retryCount}/${maxRetries})`,
                  retryCount,
                  canRetry: false,
                };
              }
              return updated;
            });
            
            // Wait before retrying
            const delay = getRetryDelay(retryCount - 1);
            if (delay > 0) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            continue;
          }
          
          // Final error (no more retries or shouldn't retry)
          setConversations(prev => {
            const updated = { ...prev };
            if (updated[model.id]) {
              updated[model.id] = {
                ...updated[model.id],
                isLoading: false,
                error: errorMessage,
                retryCount,
                canRetry: true,
                lastFailedPrompt: prompt,
              };
            }
            return updated;
          });
          break;
        }
      }
    });

    await Promise.allSettled(sendPromises);
    
    // Refresh conversations list
    setAllConversations(conversationService.getAllConversations());
  }, [activeConversationId, config.retrySettings]);

  const sendPromptToEnabledModels = useCallback(async (prompt: PromptData): Promise<void> => {
    const activeModels = enabledModels;
    if (activeModels.length === 0) {
      setError('No models are enabled');
      return;
    }

    // If no active conversation exists, create one with the prompt as the title
    let currentActiveId = activeConversationId;
    if (!currentActiveId) {
      const newConversation = conversationService.createConversation(prompt.text);
      setActiveConversationId(newConversation.id);
      setAllConversations(conversationService.getAllConversations());
      currentActiveId = newConversation.id;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt.text,
      timestamp: Date.now(),
    };

    // Add user message to conversation
    conversationService.addMessageToConversation(currentActiveId, userMessage);

    // Add user message to all active model conversations
    setConversations(prev => {
      const updated = { ...prev };
      activeModels.forEach(model => {
        if (updated[model.id]) {
          updated[model.id] = {
            ...updated[model.id],
            messages: [...updated[model.id].messages, userMessage],
            isLoading: true,
            error: undefined,
            canRetry: false,
            retryCount: 0,
          };
        }
      });
      return updated;
    });

    // Send to all enabled models
    await sendPromptToModels(activeModels, prompt);
  }, [enabledModels, sendPromptToModels, activeConversationId]);

  const clearConversation = useCallback((modelId: string): void => {
    setConversations(prev => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        messages: [],
        error: undefined,
      },
    }));
  }, []);

  const clearAllConversations = useCallback((): void => {
    // Clear all conversations from storage
    conversationService.clearAllConversations();
    
    // Clear all model conversations
    setConversations(prev => {
      const updated: Record<string, ModelConversation> = {};
      Object.keys(prev).forEach(modelId => {
        updated[modelId] = {
          ...prev[modelId],
          messages: [],
          error: undefined,
          isLoading: false,
        };
      });
      return updated;
    });
    
    // Create a new conversation and set it as active
    const newConversation = conversationService.createConversation();
    setActiveConversationId(newConversation.id);
    setAllConversations([newConversation]);
  }, []);

  // Conversation management methods
  const createNewConversation = useCallback((): void => {
    const newConversation = conversationService.createConversation();
    setActiveConversationId(newConversation.id);
    setAllConversations(conversationService.getAllConversations());
    
    // Clear current model conversations for new conversation
    setConversations(prev => {
      const updated: Record<string, ModelConversation> = {};
      Object.keys(prev).forEach(modelId => {
        updated[modelId] = {
          ...prev[modelId],
          messages: [],
          error: undefined,
          isLoading: false,
        };
      });
      return updated;
    });
  }, []);

  const selectConversation = useCallback((conversationId: string): void => {
    setActiveConversationId(conversationId);
    conversationService.setActiveConversation(conversationId);
    
    // Load conversation messages into model conversations
    const conversation = conversationService.getConversation(conversationId);
    if (conversation && models.length > 0) {
      setConversations(prev => {
        const updated: Record<string, ModelConversation> = {};
        models.forEach(model => {
          // Filter messages for this model (user messages + assistant messages from this model)
          const modelMessages = conversation.messages.filter(msg => 
            msg.role === 'user' || msg.modelId === model.id
          );
          
          updated[model.id] = {
            modelId: model.id,
            messages: modelMessages,
            error: undefined,
            isLoading: false,
            retryCount: 0,
            canRetry: false,
          };
        });
        return updated;
      });
    }
  }, [models]);

  const deleteConversation = useCallback((conversationId: string): void => {
    conversationService.deleteConversation(conversationId);
    setAllConversations(conversationService.getAllConversations());
    
    // If we deleted the active conversation, create a new one
    if (activeConversationId === conversationId) {
      createNewConversation();
    }
  }, [activeConversationId, createNewConversation]);

  return {
    // Configuration
    config,
    isConfigured,
    
    // Models
    models,
    enabledModels,
    
    // Conversations
    conversations,
    allConversations,
    activeConversationId,
    
    // Loading states
    isLoadingModels,
    isVerifyingConnection,
    
    // Error state
    error,
    
    // Actions
    verifyAndSaveConfig,
    updateRetrySettings,
    fetchModels,
    toggleModel,
    toggleModelHistory,
    sendPromptToEnabledModels,
    retryFailedModel,
    clearConversation,
    clearAllConversations,
    
    // Conversation management
    createNewConversation,
    selectConversation,
    deleteConversation,
  };
}
