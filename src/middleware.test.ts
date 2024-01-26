import middy from "@middy/core";
import { withServerTimings } from "./middleware";
import { endTime, startTime } from "./timers";

global.process = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hrtime: (() => [110, 110]) as any,
} as never;

describe("middleware", () => {
  it("should add Server-Timing header to response when ServerTiming opts is enabled", async () => {
    const handler = middy(async () => {
      startTime("jwc", "John Wick Contract");
      startTime("et", "Denzel The Great Equalizer");

      const result = {
        statusCode: 200,
        body: "hello",
      };

      await new Promise((resolve) => setTimeout(resolve, 1000));

      endTime("et");
      endTime("jwc");

      return result;
    });

    handler.use(withServerTimings({ enabled: true }));

    const response = await handler(
      {
        response: {
          headers: {},
        },
      },
      {} as never
    );

    expect(response).toEqual({
      statusCode: 200,
      body: "hello",
      headers: {
        "Server-Timing":
          'et; dur=110000.00011; desc="Denzel The Great Equalizer",jwc; dur=110000.00011; desc="John Wick Contract"',
      },
    });
  });
});
