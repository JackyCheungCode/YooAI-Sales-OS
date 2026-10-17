import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type CarbonWebComponentProps =
  DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
  Record<string, unknown>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: `cds-${string}`]: CarbonWebComponentProps;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: `cds-${string}`]: CarbonWebComponentProps;
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: `cds-${string}`]: CarbonWebComponentProps;
    }
  }
}
