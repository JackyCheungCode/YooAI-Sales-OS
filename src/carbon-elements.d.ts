import type * as React from 'react';

type CarbonCustomElementProps =
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> &
  Record<string, unknown>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: `cds-${string}`]: CarbonCustomElementProps;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: `cds-${string}`]: CarbonCustomElementProps;
    }
  }
}
