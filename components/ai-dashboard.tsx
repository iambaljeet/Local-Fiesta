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
    <div className="flex h-screen bg-gray-50">
      <ConfigurationDialog 
        isOpen={!isConfigured} 
        onConfigured={verifyAndSaveConfig}
        isVerifying={isVerifyingConnection}
        error={error}
      />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 flex-shrink-0 h-full">
        <ConversationSidebar
          conversations={allConversations}
          activeConversationId={activeConversationId}
          onNewConversation={createNewConversation}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onClearAllConversations={clearAllConversations}
          onConfigChange={verifyAndSaveConfig}
          onConfigUpdate={verifyAndSaveConfig}
          config={config}
          isVerifying={isVerifyingConnection}
          error={error}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNavigation
          conversations={allConversations}
          activeConversationId={activeConversationId}
          onNewConversation={createNewConversation}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onClearAllConversations={clearAllConversations}
          onConfigChange={verifyAndSaveConfig}
          onConfigUpdate={verifyAndSaveConfig}
          config={config}
          isVerifying={isVerifyingConnection}
          error={error}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiestaIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Local AI Fiesta
              </h1>
              <Badge 
                variant={isConfigured ? "default" : "neutral"}
                className={isConfigured ? "bg-green-100 text-green-800" : ""}
              >
                {isConfigured ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral" className="text-sm">
                {enabledModels.length} models active
              </Badge>
              <Button
                onClick={fetchModels}
                disabled={!isConfigured || isLoadingModels}
                variant="neutral"
                size="sm"
                className="flex items-center gap-2"
              >
                {isLoadingModels ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Models
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area - Flex layout with proper spacing */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* AI Windows Area - Takes available space */}
          <div className="flex-1 overflow-hidden pb-24">
            {error && (
              <div className="p-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {!isConfigured ? (
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
              /* AI Model Windows Container - takes available space above footer */
              <div className="h-full overflow-x-auto overflow-y-hidden">
                <div className="flex gap-4 p-4 min-w-max h-full">
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
                      <div key={model.id} className="flex-shrink-0 h-full">
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
        </div>

        {/* Floating Prompt */}
        {isConfigured && enabledModels.length > 0 && (
          <FloatingPrompt
            onSendPrompt={sendPromptToEnabledModels}
            enabledModelsCount={enabledModels.length}
            isSending={isSending}
          />
        )}
      </div>
    </div>
  );
}

export default AIDashboard;
