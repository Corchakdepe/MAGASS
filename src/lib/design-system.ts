// lib/design-system.ts
/**
 * BikeSim Design System
 * Centralized design tokens for consistent UI
 */

/**
 * Spacing scale (4px base unit)
 */
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const;

/**
 * Typography scales
 */
export const typography = {
  heading: {
    h1: 'text-2xl font-bold font-headline tracking-tight',
    h2: 'text-xl font-semibold font-headline',
    h3: 'text-lg font-semibold',
    h4: 'text-base font-semibold',
  },
  body: {
    lg: 'text-base leading-relaxed',
    md: 'text-sm leading-normal',
    sm: 'text-xs leading-snug',
    xs: 'text-[11px] leading-tight',
  },
  code: {
    inline: 'font-mono text-xs bg-surface-2 px-1.5 py-0.5 rounded',
    block: 'font-mono text-xs',
  },
} as const;

/**
 * Surface styles (cards, panels, etc.)
 */
export const surfaces = {
  card: 'rounded-lg border border-surface-3 bg-surface-1/85 backdrop-blur-md shadow-mac-panel',
  panel: 'rounded-lg border border-surface-3 bg-surface-0/60',
  toolbar: 'border-b border-surface-3 bg-surface-1/92 backdrop-blur-md',
  sidebar: 'bg-surface-1/85 backdrop-blur-md border-r border-surface-3 shadow-sm',
  input: 'rounded-md border border-surface-3 bg-surface-1 focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:border-accent/30',
} as const;

/**
 * Button variants
 */
export const buttons = {
  primary: 'bg-accent text-text-inverted hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent/25',
  secondary: 'bg-surface-2 text-text-primary hover:bg-surface-3 focus-visible:ring-2 focus-visible:ring-accent/25',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-0/70',
  danger: 'bg-danger text-text-inverted hover:bg-danger-hover',
} as const;

/**
 * Interactive states
 */
export const states = {
  focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
  hover: 'hover:bg-surface-0/70 transition-colors',
  active: 'bg-accent-soft text-accent border-accent/25',
  disabled: 'opacity-50 cursor-not-allowed',
} as const;

/**
 * Badge variants
 */
export const badges = {
  success: 'bg-success-soft text-success border border-success/25',
  warning: 'bg-warning-soft text-warning border border-warning/30',
  danger: 'bg-danger-soft text-danger border border-danger/25',
  info: 'bg-accent-soft text-accent border border-accent/25',
  neutral: 'bg-surface-2 text-text-secondary border border-surface-3',
} as const;

/**
 * Layout utilities
 */
export const layout = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'space-y-6',
  grid: {
    cols2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  },
} as const;

/**
 * Animation utilities
 */
export const animations = {
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',
  slideIn: 'animate-in slide-in-from-bottom duration-300',
  slideOut: 'animate-out slide-out-to-bottom duration-300',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
} as const;

/**
 * Z-index scale
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
} as const;

/**
 * Helper function to combine classes
 */
export function cx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Export all as default
 */
export default {
  spacing,
  typography,
  surfaces,
  buttons,
  states,
  badges,
  layout,
  animations,
  zIndex,
  cx,
};