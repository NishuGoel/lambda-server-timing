declare global {
  interface process {
    hrtime: (time?: Tuple) => Tuple;
  }
}

export type Tuple = [number, number];

export interface TimeObject {
  name: string;
  description: string;
  value: Tuple;
}

export interface ServerTimingOptions {
  enabled?: boolean;
}
