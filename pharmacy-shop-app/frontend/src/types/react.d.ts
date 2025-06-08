import * as React from 'react';

declare module 'react' {
  interface FunctionComponent<P = {}> {
    (props: P, context?: any): React.ReactElement<any, any> | null;
  }
  
  interface FC<P = {}> extends FunctionComponent<P> {}
} 