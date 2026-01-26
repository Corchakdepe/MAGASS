// lib/component-utils.ts
/**
 * Component utility functions
 */

import { surfaces, states } from './design-system';

/**
 * Standard card wrapper
 */
export function getCardClasses(variant: 'default' | 'panel' = 'default'): string {
  const base = variant === 'panel' ? surfaces.panel : surfaces.card;
  return `${base} p-4`;
}

/**
 * Standard input wrapper
 */
export function getInputClasses(size: 'sm' | 'md' | 'lg' = 'md'): string {
  const sizeClasses = {
    sm: 'h-8 text-xs px-2',
    md: 'h-9 text-sm px-3',
    lg: 'h-10 text-base px-4',
  };

  return `${surfaces.input} ${sizeClasses[size]} ${states.focus}`;
}

/**
 * Standard button wrapper
 */
export function getButtonClasses(
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
): string {
  const sizeClasses = {
    sm: 'h-7 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  const variantClasses = {
    primary: 'bg-accent text-text-inverted hover:bg-accent-hover',
    secondary: 'bg-surface-2 text-text-primary hover:bg-surface-3',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-0/70',
    danger: 'bg-danger text-text-inverted hover:bg-danger-hover',
  };

  return `${variantClasses[variant]} ${sizeClasses[size]} ${states.focus} rounded-md font-medium transition-colors`;
}

/**
 * Format number with locale
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Parse station IDs from string
 */
export function parseStations(input: string): number[] {
  return Array.from(
    new Set(
      (input ?? '')
        .trim()
        .split(/[^0-9]+/g)
        .filter(Boolean)
        .map(Number)
    )
  )
    .filter((n) => Number.isFinite(n) && Number.isInteger(n) && n >= 0)
    .sort((a, b) => a - b);
}

/**
 * Format station IDs to string
 */
export function formatStations(stations: number[]): string {
  return stations.join(';');
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
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

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function execuwtedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}