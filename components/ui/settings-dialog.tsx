'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { LMStudioConfig, RetrySettings } from '@/types/ai-models';

/**
 * Comprehensive Settings Component
 * Contract:
 * - Inputs: { config: LMStudioConfig, onConfigUpdate: (config: LMStudioConfig) => Promise<boolean>, isVerifying: boolean, error?: string }
 * - Output: Settings dialog with configuration and retry settings
 * - Errors: Displays verification and validation errors
 * - Side effects: Calls config update callback
 */

interface SettingsDialogProps {
  config: LMStudioConfig;
  onConfigUpdate: (config: LMStudioConfig) => Promise<boolean>;
  isVerifying: boolean;
  error?: string | null;
}

export function SettingsDialog({ 
  config, 
  onConfigUpdate, 
  isVerifying,
  error 
}: SettingsDialogProps) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [retrySettings, setRetrySettings] = useState<RetrySettings>(
    config.retrySettings || {
      enabled: true,
      maxRetries: 2,
      retryDelay: 2000,
      retryStrategy: 'fixed',
      retryOnlyModelErrors: true,
    }
  );
  const [hasChanges, setHasChanges] = useState(false);

  const handleBaseUrlChange = (value: string) => {
    setBaseUrl(value);
    setHasChanges(true);
  };

  const handleRetrySettingChange = (key: keyof RetrySettings, value: any) => {
    setRetrySettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const newConfig: LMStudioConfig = {
      baseUrl,
      isConfigured: true,
      retrySettings,
    };

    const success = await onConfigUpdate(newConfig);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleReset = () => {
    setBaseUrl(config.baseUrl);
    setRetrySettings(config.retrySettings || {
      enabled: true,
      maxRetries: 2,
      retryDelay: 2000,
      retryStrategy: 'fixed',
      retryOnlyModelErrors: true,
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="retry">Retry Strategy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">LM Studio Connection</CardTitle>
              <CardDescription className="text-xs">
                Configure the connection to your local LM Studio instance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl" className="text-xs font-medium">
                  Base URL
                </Label>
                <Input
                  id="baseUrl"
                  placeholder="http://localhost:1234"
                  value={baseUrl}
                  onChange={(e) => handleBaseUrlChange(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  The URL where your LM Studio server is running
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}
              
              {config.isConfigured && !error && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Successfully connected to LM Studio
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="retry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Retry Strategy</CardTitle>
              <CardDescription className="text-xs">
                Configure how the app handles failed requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Enable Retries</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically retry failed requests
                  </p>
                </div>
                <Switch
                  checked={retrySettings.enabled}
                  onCheckedChange={(checked) => handleRetrySettingChange('enabled', checked)}
                />
              </div>
              
              {retrySettings.enabled && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Maximum Retries</Label>
                    <Select 
                      value={retrySettings.maxRetries.toString()} 
                      onValueChange={(value) => handleRetrySettingChange('maxRetries', parseInt(value))}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 (No retries)</SelectItem>
                        <SelectItem value="1">1 retry</SelectItem>
                        <SelectItem value="2">2 retries</SelectItem>
                        <SelectItem value="3">3 retries</SelectItem>
                        <SelectItem value="5">5 retries</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Number of times to retry failed requests
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Retry Strategy</Label>
                    <Select 
                      value={retrySettings.retryStrategy} 
                      onValueChange={(value: 'immediate' | 'exponential' | 'fixed') => 
                        handleRetrySettingChange('retryStrategy', value)
                      }
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate (No delay)</SelectItem>
                        <SelectItem value="fixed">Fixed delay</SelectItem>
                        <SelectItem value="exponential">Exponential backoff</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How long to wait between retry attempts
                    </p>
                  </div>
                  
                  {retrySettings.retryStrategy !== 'immediate' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">
                        {retrySettings.retryStrategy === 'fixed' ? 'Retry Delay' : 'Base Delay'}
                      </Label>
                      <Select 
                        value={retrySettings.retryDelay.toString()} 
                        onValueChange={(value) => handleRetrySettingChange('retryDelay', parseInt(value))}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1000">1 second</SelectItem>
                          <SelectItem value="2000">2 seconds</SelectItem>
                          <SelectItem value="3000">3 seconds</SelectItem>
                          <SelectItem value="5000">5 seconds</SelectItem>
                          <SelectItem value="10000">10 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {retrySettings.retryStrategy === 'exponential' 
                          ? 'Base delay that doubles with each retry'
                          : 'Fixed delay between retries'
                        }
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Smart Retry</Label>
                      <p className="text-xs text-muted-foreground">
                        Only retry model-specific errors (not network issues)
                      </p>
                    </div>
                    <Switch
                      checked={retrySettings.retryOnlyModelErrors}
                      onCheckedChange={(checked) => handleRetrySettingChange('retryOnlyModelErrors', checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="neutral"
          size="sm"
          onClick={handleReset}
          disabled={!hasChanges || isVerifying}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isVerifying}
          size="sm"
        >
          {isVerifying ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Settings className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
