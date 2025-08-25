import { Conversation, ChatMessage } from '@/types/ai-models';

/**
 * Service for managing conversations and history
 * Contract:
 * - Inputs: conversation data, messages, search queries
 * - Output: conversation management operations
 * - Errors: Storage errors handled gracefully
 * - Side effects: localStorage read/write operations with LIFO cleanup
 */

const STORAGE_KEYS = {
  CONVERSATIONS: 'conversations',
  ACTIVE_CONVERSATION: 'active_conversation_id',
} as const;

const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
const MAX_CONVERSATIONS = 50; // Maximum number of conversations to keep

export class ConversationService {
  private isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage != null;
    } catch {
      return false;
    }
  }

  private estimateStorageSize(): number {
    if (!this.isAvailable()) return 0;
    
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
    } catch {
      return 0;
    }
    return total;
  }

  private cleanupOldConversations(): void {
    const conversations = this.getAllConversations();
    
    // Sort by last updated (oldest first)
    const sortedConversations = conversations.sort((a, b) => a.updatedAt - b.updatedAt);
    
    // Remove oldest conversations if we exceed limits
    while (sortedConversations.length > MAX_CONVERSATIONS) {
      const oldest = sortedConversations.shift();
      if (oldest) {
        this.deleteConversation(oldest.id);
      }
    }

    // Check storage size and remove more if needed
    while (this.estimateStorageSize() > MAX_STORAGE_SIZE && sortedConversations.length > 1) {
      const oldest = sortedConversations.shift();
      if (oldest) {
        this.deleteConversation(oldest.id);
      }
    }
  }

  createConversation(initialMessage?: string): Conversation {
    const conversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: initialMessage ? this.generateTitle(initialMessage) : 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelIds: [],
    };

    this.saveConversation(conversation);
    this.setActiveConversation(conversation.id);
    return conversation;
  }

  private generateTitle(message: string): string {
    // Generate a title from the first message (max 50 chars)
    const title = message.trim().substring(0, 50);
    return title.length === 50 ? title + '...' : title;
  }

  getAllConversations(): Conversation[] {
    if (!this.isAvailable()) return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (stored) {
        const conversations = JSON.parse(stored);
        return Array.isArray(conversations) ? conversations : [];
      }
    } catch (error) {
      console.warn('Failed to load conversations:', error);
    }
    return [];
  }

  getConversation(id: string): Conversation | null {
    const conversations = this.getAllConversations();
    return conversations.find(conv => conv.id === id) || null;
  }

  saveConversation(conversation: Conversation): void {
    if (!this.isAvailable()) return;

    try {
      const conversations = this.getAllConversations();
      const existingIndex = conversations.findIndex(conv => conv.id === conversation.id);
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.push(conversation);
      }

      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      this.cleanupOldConversations();
    } catch (error) {
      console.warn('Failed to save conversation:', error);
      // Try cleanup and retry once
      this.cleanupOldConversations();
      try {
        const conversations = this.getAllConversations();
        const existingIndex = conversations.findIndex(conv => conv.id === conversation.id);
        
        if (existingIndex >= 0) {
          conversations[existingIndex] = conversation;
        } else {
          conversations.push(conversation);
        }
        localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      } catch (retryError) {
        console.error('Failed to save conversation after cleanup:', retryError);
      }
    }
  }

  deleteConversation(id: string): void {
    if (!this.isAvailable()) return;

    try {
      const conversations = this.getAllConversations();
      const filtered = conversations.filter(conv => conv.id !== id);
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));

      // If we're deleting the active conversation, set a new active one
      if (this.getActiveConversationId() === id) {
        const remaining = this.getAllConversations();
        if (remaining.length > 0) {
          this.setActiveConversation(remaining[0].id);
        } else {
          this.clearActiveConversation();
        }
      }
    } catch (error) {
      console.warn('Failed to delete conversation:', error);
    }
  }

  addMessageToConversation(conversationId: string, message: ChatMessage): void {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return;

    conversation.messages.push(message);
    conversation.updatedAt = Date.now();
    
    // Update title if this is the first user message
    if (message.role === 'user' && conversation.messages.filter(m => m.role === 'user').length === 1) {
      conversation.title = this.generateTitle(message.content);
    }

    // Track which models are participating
    if (message.modelId && !conversation.modelIds.includes(message.modelId)) {
      conversation.modelIds.push(message.modelId);
    }

    this.saveConversation(conversation);
  }

  getActiveConversationId(): string | null {
    if (!this.isAvailable()) return null;

    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    } catch {
      return null;
    }
  }

  setActiveConversation(id: string): void {
    if (!this.isAvailable()) return;

    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, id);
    } catch (error) {
      console.warn('Failed to set active conversation:', error);
    }
  }

  clearActiveConversation(): void {
    if (!this.isAvailable()) return;

    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    } catch (error) {
      console.warn('Failed to clear active conversation:', error);
    }
  }

  searchConversations(query: string): Conversation[] {
    if (!query.trim()) return this.getAllConversations();

    const conversations = this.getAllConversations();
    const lowerQuery = query.toLowerCase();

    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(lowerQuery))
    ).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getConversationHistory(conversationId: string, modelId: string): ChatMessage[] {
    const conversation = this.getConversation(conversationId);
    if (!conversation) return [];

    // Return all messages for the conversation
    // LM Studio can handle the full context
    return conversation.messages;
  }

  clearAllConversations(): void {
    if (!this.isAvailable()) return;

    try {
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    } catch (error) {
      console.warn('Failed to clear conversations:', error);
    }
  }

  exportConversation(id: string): string | null {
    const conversation = this.getConversation(id);
    if (!conversation) return null;

    try {
      return JSON.stringify(conversation, null, 2);
    } catch (error) {
      console.warn('Failed to export conversation:', error);
      return null;
    }
  }

  importConversation(jsonData: string): Conversation | null {
    try {
      const conversation = JSON.parse(jsonData) as Conversation;
      
      // Validate the conversation structure
      if (!conversation.id || !conversation.title || !Array.isArray(conversation.messages)) {
        return null;
      }

      // Generate new ID to avoid conflicts
      conversation.id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.saveConversation(conversation);
      return conversation;
    } catch (error) {
      console.warn('Failed to import conversation:', error);
      return null;
    }
  }
}

export const conversationService = new ConversationService();
