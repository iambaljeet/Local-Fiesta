'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Conversation } from '@/types/ai-models';
import { ConfigurationDialog } from '@/components/ui/configuration-dialog';
import { SettingsDialog } from '@/components/ui/settings-dialog';
import { Plus, MessageSquare, Settings, Trash2, Download, Upload, Search, Trash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatTimestamp } from '@/lib/utils/ai-utils';

/**
 * Conversation Sidebar Component
 * Contract:
 * - Inputs: { conversations: Conversation[], activeConversationId: string | null, onNewConversation: () => void, onSelectConversation: (id: string) => void, onDeleteConversation: (id: string) => void, onConfigChange: (url: string) => Promise<boolean>, isVerifying: boolean, error?: string }
 * - Output: Sidebar with conversation list and settings
 * - Errors: Displays configuration errors
 * - Side effects: Conversation management, settings configuration
 */

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAllConversations: () => void;
  onConfigChange: (url: string) => Promise<boolean>;
  onConfigUpdate: (config: any) => Promise<boolean>;
  config: any;
  isVerifying: boolean;
  error?: string | null;
  className?: string;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onClearAllConversations,
  onConfigChange,
  onConfigUpdate,
  config,
  isVerifying,
  error,
  className = ''
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExportConversation = (conversation: Conversation) => {
    const dataStr = JSON.stringify(conversation, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation-${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <Card className={`flex flex-col h-full ${className} overflow-hidden`}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Conversations</h3>
          <div className="flex gap-1">
            <Button
              variant="neutral"
              size="sm"
              onClick={onNewConversation}
              className="h-8 w-8 p-0"
              title="New Conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            {conversations.length > 0 && (
              <Button
                variant="neutral"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all conversations? This action cannot be undone.')) {
                    onClearAllConversations();
                  }
                }}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                title="Clear All Conversations"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
            
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button
                  variant="neutral"
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <SettingsDialog
                  config={config}
                  onConfigUpdate={onConfigUpdate}
                  isVerifying={isVerifying}
                  error={error}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-3 pt-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                {!searchQuery && (
                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={onNewConversation}
                    className="mt-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Start New Chat
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-2 rounded-lg border cursor-pointer transition-colors group hover:bg-muted/50 ${
                      activeConversationId === conversation.id
                        ? 'bg-muted border-muted-foreground/50'
                        : 'border-muted'
                    }`}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium truncate">
                          {truncateText(conversation.title)}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(conversation.updatedAt, 'relative')}
                        </p>
                        
                        {conversation.messages.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {truncateText(
                              conversation.messages[conversation.messages.length - 1]?.content || '',
                              80
                            )}
                          </p>
                        )}
                        
                        {conversation.modelIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="neutral" className="text-xs px-1 py-0">
                              {conversation.modelIds.length} model{conversation.modelIds.length > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="neutral"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportConversation(conversation);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          variant="neutral"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this conversation?')) {
                              onDeleteConversation(conversation.id);
                            }
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
