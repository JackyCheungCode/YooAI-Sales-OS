import { Tag } from '@carbon/react';
import type { ReactNode } from 'react';
type Tone = 'neutral' | 'success' | 'warning' | 'info';
const typeByTone = { neutral: 'gray', success: 'green', warning: 'warm-gray', info: 'blue' } as const;
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <Tag type={typeByTone[tone]}>{children}</Tag>;
}
