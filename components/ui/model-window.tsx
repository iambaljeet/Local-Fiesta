'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Bot, User, Trash2, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIModel, ModelConversation, ChatMessage } from '@/types/ai-models';

/**
 * Model Window Component
 * Contract:
 * - Inputs: { model: AIModel, conversation: ModelConversation, onToggle: (id: string, enabled: boolean) => void, onClearConversation: (id: string) => void }
 * - Output: Individual model chat window with controls
 * - Errors: Displays conversation errors inline
 * - Side effects: Calls toggle and clear callbacks
 */

interface ModelWindowProps {
  model: AIModel;
  conversation: ModelConversation;
  onToggle: (modelId: string, enabled: boolean) => void;
  onToggleHistory: (modelId: string, useHistory: boolean) => void;
  onClearConversation: (modelId: string) => void;
  onRetryModel?: (modelId: string) => void;
}

export function ModelWindow({ 
  model, 
  conversation, 
  onToggle, 
  onToggleHistory,
  onClearConversation,
  onRetryModel
}: ModelWindowProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Check if user is near bottom of scroll area
  const checkScrollPosition = useCallback(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const threshold = 100; // pixels from bottom
      const nearBottom = scrollHeight - scrollTop - clientHeight <= threshold;
      setIsNearBottom(nearBottom);
      
      // Only auto-scroll if user is near bottom
      setShouldAutoScroll(nearBottom);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (shouldAutoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [conversation.messages, shouldAutoScroll]);

  // Add scroll listener
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    
    const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollPosition);
      return () => scrollElement.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  const handleToggle = (checked: boolean) => {
    onToggle(model.id, checked);
  };

  const handleToggleHistory = (checked: boolean) => {
    onToggleHistory(model.id, checked);
  };

  const handleClearConversation = () => {
    onClearConversation(model.id);
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    return (
      <div
        key={index}
        className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <div className={`p-2 rounded-full ${isUser ? 'bg-primary' : 'bg-muted'}`}>
          {isUser ? (
            <User className="h-4 w-4 text-primary-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
          <div
            className={`rounded-lg p-3 text-sm ${
              isUser
                ? 'bg-primary text-primary-foreground ml-4'
                : 'bg-muted mr-4'
            }`}
          >
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          </div>
          <div className="text-xs text-muted-foreground mt-1 px-3">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`flex-shrink-0 flex flex-col h-full w-full transition-opacity ${
      model.isEnabled ? 'opacity-100' : 'opacity-60'
    }`}>
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 bg-card border-b">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium flex-1 min-w-0 leading-tight">
              <div className="line-clamp-2 break-words">
                {model.name}
              </div>
            </CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={model.isOnline ? 'default' : 'neutral'} className="text-xs whitespace-nowrap">
                {model.isOnline ? 'Online' : 'Offline'}
              </Badge>
              <Switch
                checked={model.isEnabled}
                onCheckedChange={handleToggle}
                disabled={!model.isOnline}
              />
            </div>
          </div>
          
          {/* History Toggle */}
          {model.isEnabled && (
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>Use conversation history</span>
              <Switch
                checked={model.useHistory ?? false}
                onCheckedChange={handleToggleHistory}
                disabled={!model.isOnline}
              />
            </div>
          )}
          
          {conversation.messages.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="neutral"
                size="sm"
                onClick={handleClearConversation}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </CardHeader>
      </div>

      {/* Content Area - takes remaining space */}
      <CardContent className="flex-1 flex flex-col min-h-0 px-4 py-4 relative">
        {conversation.error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <div className="flex-1">
              <AlertDescription className="text-xs">
                {conversation.error}
                {conversation.retryCount !== undefined && conversation.retryCount > 0 && (
                  <span className="text-muted-foreground ml-2">
                    (Attempted {conversation.retryCount} time{conversation.retryCount !== 1 ? 's' : ''})
                  </span>
                )}
              </AlertDescription>
              {conversation.error.toLowerCase().includes('not loaded') && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <strong>How to fix:</strong>
                  <br />1. Open LM Studio
                  <br />2. Load the "{model.name}" model
                  <br />3. Start the local server
                  <br />4. Try sending your message again
                </div>
              )}
              {conversation.canRetry && onRetryModel && (
                <div className="mt-3">
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => onRetryModel(model.id)}
                    disabled={conversation.isLoading}
                    className="h-7 text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </Alert>
        )}

        <ScrollArea ref={scrollAreaRef} className="flex-1 w-full">
          <div className="space-y-4 p-1">
            {conversation.messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-center">
                <div className="text-muted-foreground text-sm">
                  {model.isEnabled 
                    ? 'Send a message to start the conversation'
                    : 'Enable this model to start chatting'
                  }
                </div>
              </div>
            ) : (
              conversation.messages.map((message: ChatMessage, index: number) => renderMessage(message, index))
            )}
            
            {conversation.isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Bot className="h-4 w-4" />
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Scroll to bottom indicator */}
        {!isNearBottom && conversation.messages.length > 0 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => {
                if (scrollAreaRef.current) {
                  const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
                  if (scrollElement) {
                    scrollElement.scrollTop = scrollElement.scrollHeight;
                    setShouldAutoScroll(true);
                    setIsNearBottom(true);
                  }
                }
              }}
              className="h-8 px-3 text-xs shadow-lg bg-background/90 backdrop-blur-sm border"
            >
              ↓ New messages
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
