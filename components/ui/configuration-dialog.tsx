'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * Configuration Dialog Component
 * Contract:
 * - Inputs: { isOpen: boolean, onConfigured: (baseUrl: string) => Promise<boolean>, isVerifying: boolean }
 * - Output: Dialog with form to configure LM Studio endpoint
 * - Errors: Displays verification errors inline
 * - Side effects: Calls onConfigured callback with baseUrl
 */

interface ConfigurationDialogProps {
  isOpen: boolean;
  onConfigured: (baseUrl: string) => Promise<boolean>;
  isVerifying: boolean;
  error?: string | null;
}

export function ConfigurationDialog({ 
  isOpen, 
  onConfigured, 
  isVerifying, 
  error 
}: ConfigurationDialogProps) {
  const [baseUrl, setBaseUrl] = useState('http://localhost:1234');
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttempted(true);
    
    const success = await onConfigured(baseUrl);
    if (!success) {
      // Error is handled by parent component
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure LM Studio
          </DialogTitle>
          <DialogDescription>
            Enter the base URL for your LM Studio API endpoint. Make sure LM Studio is running with API server enabled.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:1234"
              disabled={isVerifying}
              className={hasAttempted && !isValidUrl(baseUrl) ? 'border-red-500' : ''}
            />
            {hasAttempted && !isValidUrl(baseUrl) && (
              <p className="text-sm text-red-500">Please enter a valid URL</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Setup Instructions:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open LM Studio application</li>
              <li>Go to Developer tab</li>
              <li>Start the local server</li>
              <li>Note the server address (usually http://localhost:1234)</li>
              <li>Enter the address above and click verify</li>
            </ol>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isVerifying || !isValidUrl(baseUrl)}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Connection...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify & Save Configuration
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
