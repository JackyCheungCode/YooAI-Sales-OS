import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: `cds-${string}`]: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}
