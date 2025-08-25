'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ConversationSidebar } from '@/components/ui/conversation-sidebar';
import { Conversation } from '@/types/ai-models';
import { Menu } from 'lucide-react';

/**
 * Mobile Navigation Component
 * Contract:
 * - Inputs: Same as ConversationSidebar props
 * - Output: Mobile-friendly navigation with slide-out panel
 * - Errors: Passes through sidebar errors
 * - Side effects: Sheet state management
 */

interface MobileNavigationProps {
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
}

export function MobileNavigation(props: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectConversation = (id: string) => {
    props.onSelectConversation(id);
    setIsOpen(false); // Close sheet after selection
  };

  const handleNewConversation = () => {
    props.onNewConversation();
    setIsOpen(false); // Close sheet after creating new conversation
  };

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="neutral" size="sm" className="fixed top-4 left-4 z-50">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <ConversationSidebar
            {...props}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            className="h-full border-0"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
