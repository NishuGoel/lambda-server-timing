import Log from "@dazn/lambda-powertools-logger";
import * as Lambda from "aws-lambda";
import middy from "@middy/core";
import { getServerTimings } from "./timers";
import type { ServerTimingOptions } from "./types";

/**
 * Server-Timing middleware
 *
 * @returns a lambda middleware that adds a Server-Timing header to the response
 */
export const withServerTimings = (opts?: ServerTimingOptions) => {
  if (opts?.enabled) {
    return {
      // add Server-Timing header to response
      after: (handler: middy.Request) => {
        const response =
          (handler?.response as Lambda.APIGatewayProxyStructuredResultV2) || {};
        // get timings from request

        try {
          const headers: unknown[] = [];
          const timings = getServerTimings(headers);

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
