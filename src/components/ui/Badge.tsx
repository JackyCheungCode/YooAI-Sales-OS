import { createElement, type ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'info';
const colorByTone = { neutral: 'gray', success: 'green', warning: 'warm-gray', info: 'blue' } as const;

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return createElement('cds-tag', { type: colorByTone[tone] }, children);
}
