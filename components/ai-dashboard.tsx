'use client';

import { useAIModels } from '@/hooks/use-ai-models';
import { ConfigurationDialog } from '@/components/ui/configuration-dialog';
import { ConversationSidebar } from '@/components/ui/conversation-sidebar';
import { MobileNavigation } from '@/components/ui/mobile-navigation';
import { ModelWindow } from '@/components/ui/model-window';
import { FloatingPrompt } from '@/components/ui/floating-prompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { FiestaIcon } from '@/components/ui/fiesta-icon';

/**
 * Local AI Fiesta Component
 * Contract:
 * - Manages multiple AI model conversations
 * - Provides sidebar for history and configuration
 * - Supports mobile navigation
 * - Handles model configuration and connection
 */
function AIDashboard() {
  const {
    config,
    models,
    conversations,
    allConversations,
    activeConversationId,
    error,
    isConfigured,
    enabledModels,
    isLoadingModels,
    isVerifyingConnection,
    verifyAndSaveConfig,
    updateRetrySettings,
    fetchModels,
    toggleModel,
    toggleModelHistory,
    clearConversation,
    clearAllConversations,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sendPromptToEnabledModels,
    retryFailedModel
  } = useAIModels();

  // Check if any model is currently sending
  const isSending = Object.values(conversations).some(conv => conv.isLoading);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ConfigurationDialog 
        isOpen={!isConfigured} 
        isVerifying={isVerifyingConnection}
        onConfigured={async (baseUrl) => {
          // Configuration is handled by the hook
          return true;
        }}
      />

      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiestaIcon className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Local AI Fiesta</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="neutral"
              onClick={() => window.location.reload()}
              disabled={isLoadingModels || isVerifyingConnection}
              className="flex items-center gap-2"
            >
              {(isLoadingModels || isVerifyingConnection) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Models
            </Button>
          </div>
        </div>
      </header>

      {/* Body - Horizontal split */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Conversation History Sidebar - Fixed width */}
        <div className="w-80 flex-shrink-0 border-r bg-white">
          <ConversationSidebar 
            conversations={allConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={createNewConversation}
            onDeleteConversation={deleteConversation}
            onClearAllConversations={clearAllConversations}
            onConfigChange={async (url) => true}
            onConfigUpdate={async (config) => true}
            config={config}
            isVerifying={isVerifyingConnection}
            error={error}
          />
        </div>

        {/* Right: Main content area - Takes remaining space, no overflow */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          {/* Top: AI Models Container (takes all remaining space) */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {error && (
              <div className="p-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}            {!isConfigured ? (
              <div className="h-full flex items-center justify-center p-8">
                <Card className="w-full max-w-md">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <FiestaIcon className="h-6 w-6" />
                      Welcome to Local AI Fiesta
                    </CardTitle>
                    <CardDescription>
                      Connect to LM Studio to start your local AI party with multiple models
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button 
                      onClick={() => verifyAndSaveConfig(config.baseUrl)}
                      className="w-full"
                    >
                      Connect to LM Studio
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : enabledModels.length === 0 ? (
              <div className="h-full flex items-center justify-center p-8">
                <Card className="w-full max-w-md">
                  <CardHeader className="text-center">
                    <CardTitle>No Models Available</CardTitle>
                    <CardDescription>
                      No AI models are currently loaded in LM Studio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Load some models in LM Studio and refresh to get started
                    </p>
                    <Button 
                      onClick={fetchModels}
                      disabled={isLoadingModels}
                      className="w-full"
                    >
                      {isLoadingModels ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Checking...
                        </>
                      ) : (
                        'Refresh Models'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* AI Model Windows Container - fits within available space */
              <div className="h-full overflow-hidden">
                <div className="flex gap-4 p-4 h-full overflow-x-auto">
                  {enabledModels.map((model) => {
                    const modelConversation = conversations[model.id] || {
                      modelId: model.id,
                      messages: [],
                      isLoading: false,
                      error: undefined,
                      retryCount: 0,
                      canRetry: false,
                      lastFailedPrompt: undefined
                    };
                    
                    return (
                      <div key={model.id} className="w-96 flex-shrink-0 h-full">
                        <ModelWindow
                          model={model}
                          conversation={modelConversation}
                          onToggle={toggleModel}
                          onToggleHistory={toggleModelHistory}
                          onClearConversation={clearConversation}
                          onRetryModel={retryFailedModel}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom: Fixed Prompt Section (not floating, just bottom of the layout) */}
          {isConfigured && enabledModels.length > 0 && (
            <div className="flex-shrink-0 border-t bg-white">
              <FloatingPrompt
                onSendPrompt={sendPromptToEnabledModels}
                enabledModelsCount={enabledModels.length}
                isSending={isSending}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIDashboard;
