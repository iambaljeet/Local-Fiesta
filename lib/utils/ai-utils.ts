/**
 * Utility functions for the AI Models feature
 * Contract:
 * - Inputs: various data types for formatting and validation
 * - Output: formatted strings, validation results
 * - Errors: none (graceful fallbacks)
 * - Side effects: none (pure functions)
 */

export function formatModelName(modelName: string): string {
  // Remove common prefixes and make more readable
  return modelName
    .replace(/^(ggml-|llama-|mistral-|codellama-)/, '')
    .replace(/\.(gguf|bin)$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTimestamp(timestamp: number, format: 'time' | 'relative' = 'time'): string {
  const date = new Date(timestamp);
  
  if (format === 'relative') {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }
  
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function validateApiUrl(url: string): { isValid: boolean; error?: string } {
  if (!url.trim()) {
    return { isValid: false, error: 'URL is required' };
  }
  
  try {
    const parsed = new URL(url);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

export function getModelStatusColor(isOnline: boolean, isEnabled: boolean): string {
  if (!isOnline) return 'text-red-500';
  if (isEnabled) return 'text-green-500';
  return 'text-yellow-500';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function parseStreamingJsonLine(line: string): unknown | null {
  try {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      if (data === '[DONE]') return null;
      return JSON.parse(data);
    }
    return null;
  } catch {
    return null;
  }
}

export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isTextFile(fileName: string): boolean {
  const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.xml', '.csv'];
  return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

export function isImageFile(fileName: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
  return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}
