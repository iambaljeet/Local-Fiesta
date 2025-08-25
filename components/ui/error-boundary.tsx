'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary Component
 * Contract:
 * - Inputs: { children: ReactNode, fallback?: ReactNode }
 * - Output: children on success, error UI on render error
 * - Errors: catches and displays React render errors
 * - Side effects: console.error for error logging
 */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 max-w-md mx-auto mt-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-3">
              <div>
                <strong>Something went wrong</strong>
              </div>
              <div className="text-sm">
                {this.state.error?.message || 'An unexpected error occurred'}
              </div>
              <Button
                variant="neutral"
                size="sm"
                onClick={this.handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
