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
import { RefreshCw, Brain, AlertCircle, Loader2 } from 'lucide-react';

/**
 * AI Dashboard Component
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
    verifyAndSaveConfig,
    updateRetrySettings,
    fetchModels,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sendPromptToEnabledModels,
    retryFailedModel
  } = useAIModels();

  // Check if any model is currently sending
  const isSending = Object.values(conversations).some(conv => conv.isLoading);

  const handleConnect = async (baseUrl: string) => {
    const success = await verifyAndSaveConfig(baseUrl);
    if (success) {
      await fetchModels();
    }
  };

  const handleUpdateConfig = (newConfig: { baseUrl: string }) => {
    verifyAndSaveConfig(newConfig.baseUrl);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ConfigurationDialog 
        isOpen={!isConfigured} 
        onSave={handleConnect}
        config={config}
      />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ConversationSidebar
          conversations={allConversations}
          currentConversationId={activeConversationId}
          onNewConversation={createNewConversation}
          onSwitchConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          isConnected={isConfigured}
          currentConfig={config}
          onUpdateConfig={handleUpdateConfig}
          onUpdateRetrySettings={updateRetrySettings}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNavigation
          conversations={allConversations}
          currentConversationId={activeConversationId}
          onNewConversation={createNewConversation}
          onSwitchConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          isConnected={isConfigured}
          currentConfig={config}
          onUpdateConfig={handleUpdateConfig}
          onUpdateRetrySettings={updateRetrySettings}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                AI Dashboard
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

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="p-4 flex-shrink-0">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {!isConfigured ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Brain className="h-6 w-6" />
                    Welcome to AI Dashboard
                  </CardTitle>
                  <CardDescription>
                    Connect to LM Studio to get started with multiple AI models
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    onClick={() => handleConnect(config.baseUrl)}
                    className="w-full"
                  >
                    Connect to LM Studio
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : enabledModels.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
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
            <>
              {/* Model Windows */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="flex gap-4 p-4 min-w-max">
                    {enabledModels.map((model) => {
                      const modelConversation = conversations[model.id];
                      
                      return (
                        <div key={model.id} className="flex-shrink-0">
                          <ModelWindow
                            model={model}
                            conversation={modelConversation}
                          />
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Floating Prompt */}
              <FloatingPrompt
                onSubmit={sendPromptToEnabledModels}
                disabled={!isConfigured || enabledModels.length === 0 || isSending}
                isLoading={isSending}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIDashboard;
