'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AttachmentFile, PromptData } from '@/types/ai-models';
import { Paperclip, Send, X, Loader2, File, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Floating Prompt Component
 * Contract:
 * - Inputs: { onSendPrompt: (data: PromptData) => Promise<void>, enabledModelsCount: number, isSending: boolean }
 * - Output: Floating prompt interface with text and file attachments
 * - Errors: File size/type validation errors via toast
 * - Side effects: Calls onSendPrompt callback, file reading operations
 */

interface FloatingPromptProps {
  onSendPrompt: (data: PromptData) => Promise<void>;
  enabledModelsCount: number;
  isSending: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'application/json',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export function FloatingPrompt({ 
  onSendPrompt, 
  enabledModelsCount, 
  isSending 
}: FloatingPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        continue;
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`File type "${file.type}" is not supported.`);
        continue;
      }

      try {
        const content = await readFileContent(file);
        const attachment: AttachmentFile = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          content,
        };

        setAttachments(prev => [...prev, attachment]);
        toast.success(`Added "${file.name}" as attachment`);
      } catch (error) {
        toast.error(`Failed to read "${file.name}"`);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readFileContent = (file: File): Promise<string | ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => reject(reader.error);

      // Read as text for text files, as data URL for images
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleSend = async () => {
    if (!prompt.trim() && attachments.length === 0) {
      toast.error('Please enter a message or add an attachment');
      return;
    }

    if (enabledModelsCount === 0) {
      toast.error('Please enable at least one model to send a message');
      return;
    }

    const promptData: PromptData = {
      text: prompt.trim(),
      attachments,
    };

    try {
      await onSendPrompt(promptData);
      
      // Clear form after successful send
      setPrompt('');
      setAttachments([]);
      toast.success(`Message sent to ${enabledModelsCount} model${enabledModelsCount > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="p-4">
      <Card className="p-4 shadow-lg border-2">
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <Badge key={attachment.id} variant="neutral" className="flex items-center gap-2 p-2">
                {getFileIcon(attachment.type)}
                <span className="text-xs">
                  {attachment.name} ({formatFileSize(attachment.size)})
                </span>
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => removeAttachment(attachment.id)}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Cmd/Ctrl + Enter to send)"
              className="min-h-[60px] resize-none"
              disabled={isSending}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              variant="neutral"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className="h-10 w-10 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleSend}
              disabled={isSending || enabledModelsCount === 0}
              className="h-10 w-10 p-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {enabledModelsCount > 0 
              ? `Will send to ${enabledModelsCount} enabled model${enabledModelsCount > 1 ? 's' : ''}`
              : 'No models enabled'
            }
          </span>
          <span>Cmd/Ctrl + Enter to send</span>
        </div>
      </Card>
    </div>
  );
}
