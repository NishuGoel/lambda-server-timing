import middy from "@middy/core";
interface ServerTimingOptions {
    enabled?: boolean;
}
/**
 * @returns a lambda middleware that adds a Server-Timing header to the response
 */
export declare const withServerTimings: (opts?: ServerTimingOptions) => {
    after: (handler: middy.Request) => void;
};
/**
 * @param name
 * @param description
 * Records the start time of a metric
 */
export declare const startTime: (name: string, description?: string) => void;
/**
 * @param name
 * @param description
 *
 * @returns TimeObject
 * Records the duration of a metric and sets a metric timing
 */
export declare const endTime: (name: string, description?: string) => void | Record<string, unknown>;
interface TimeObject {
    name: string;
    description?: string;
    value: [number, number];
}
export declare const setMetric: ({ name, value, description }: TimeObject) => void;
export {};
