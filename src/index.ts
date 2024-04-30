import Log from "@dazn/lambda-powertools-logger";
import middy from "@middy/core";
import * as Lambda from "aws-lambda";

interface ServerTimingOptions {
  enabled?: boolean;
}
/**
 * @returns a lambda middleware that adds a Server-Timing header to the response
 */
export const withServerTimings = (opts?: ServerTimingOptions) => {
  if (opts?.enabled) {
    return {
      // add Server-Timing header to response
      after: (handler: middy.Request) => {
        const response =
          handler.response as Lambda.APIGatewayProxyStructuredResultV2;
        // get timings from request

        try {
          const headers: unknown[] = [];
          const timings = getServerTimingHeader(headers);

          response.headers = {
            ...response.headers,
            "Server-Timing": timings,
          };
        } catch (e) {
          Log.debug(`Error: Could not record server timings - ${e}`);
        }
      },
    };
  } else {
    return {
      after: () => {},
    };
  }
};

/**
 * @param name
 * @param description
 * Records the start time of a metric
 */
export const startTime = (name: string, description?: string) => {
  try {
    if (typeof name !== "string") {
      return Log.debug("Metric name is not string");
    }

    timer(name, description);
  } catch (e) {
    Log.debug(`Error: Could not record start time ${name} - ${e}`);
  }
};

/**
 * @param name
 * @param description
 * Records the duration of a metric and sets a metric timing
 */
export const endTime = (name: string, description?: string) => {
  try {
    if (typeof name !== "string") {
      return Log.debug("Metric name is not string");
    }

    const obj = timerEnd(name);
    if (!obj) {
      return;
    }
    setMetric({
      name: obj.name as string,
      description: (obj.description as string) ?? description,
      value: obj.value as [number, number],
    });
  } catch (e) {
    Log.debug(`Error: Could not record end time for ${name} - ${e}`);
  }
};

// measure time
interface TimeObject {
  name: string;
  description?: string;
  value: [number, number];
}
const times = new Map<string, Record<string, unknown>>();
const timer = (name: string, description?: string) => {
  times.set(name, {
    name,
    description: description || "",
    startTime: process.hrtime(),
  });
};

const timerEnd = (name: string, description?: string) => {
  const timeObj = times.get(name);
  if (!timeObj) {
    return Log.debug(`No such name ${name}`);
  }
  const duration = process.hrtime(timeObj.startTime as [number, number]);
  if (!timeObj.description) {
    timeObj.description = description;
  }
  const value = duration[0] * 1e3 + duration[1] * 1e-6;
  timeObj.value = value;
  times.delete(name);

  return timeObj;
};

let tempHeaders: unknown[] = [];

export const setMetric = ({ name, value, description }: TimeObject) => {
  if (typeof name !== "string") {
    return Log.debug("1st argument name is not string");
  }
  if (typeof value !== "number") {
    return Log.debug("2nd argument value is not number");
  }

  const dur = value;

  const metric =
    typeof description !== "string" || !description
      ? `${name}; dur=${dur ?? 0}`
      : `${name}; dur=${dur}; desc="${description}"`;

  tempHeaders.push(metric);
};

const getServerTimingHeader = (headers: unknown[]) => {
  headers.push(tempHeaders?.toString());
  tempHeaders = [];

  return headers?.toString();
};
