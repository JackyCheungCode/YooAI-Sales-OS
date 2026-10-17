import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elementName: `cds-${string}`]: any;
    }
  }
}
