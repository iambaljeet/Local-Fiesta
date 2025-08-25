'use client';

import { useAIModelsSimple } from '@/hooks/use-ai-models-simple';

export default function AIDashboardSimple() {
  const { isConfigured } = useAIModelsSimple();

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-xl font-semibold">Local AI Fiesta</h1>
            <p className="text-sm text-muted-foreground">
              Configured: {isConfigured ? 'Yes' : 'No'}
            </p>
          </div>
        </header>
        <div className="flex-1 container mx-auto px-4 py-6">
          <p>Dashboard is loading...</p>
        </div>
      </div>
    </div>
  );
}
