'use client';

import { useState, useEffect, useCallback } from 'react';

export function useAIModelsSimple() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    isConfigured: mounted,
    models: [],
    conversations: {},
    allConversations: [],
    activeConversationId: null,
    enabledModels: [],
    isLoadingModels: false,
    isVerifyingConnection: false,
    error: null,
    verifyAndSaveConfig: async () => true,
    fetchModels: async () => {},
    toggleModel: () => {},
    toggleModelHistory: () => {},
    sendPromptToEnabledModels: async () => {},
    clearConversation: () => {},
    createNewConversation: () => {},
    selectConversation: () => {},
    deleteConversation: () => {},
  };
}
