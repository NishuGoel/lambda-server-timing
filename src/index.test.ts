import {
  startTime,
  endTime,
  setMetric,
  trackTime,
  withServerTimings,
  isColdStart,
  getColdStartDuration,
  _resetColdStartState,
} from "./index";

// Helper to wait a known duration
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("startTime / endTime", () => {
  it("should record and return a timing metric", async () => {
    startTime("db-query", "Database Query");
    await sleep(50);
    const result = endTime("db-query", "Database Query");

    expect(result).toBeDefined();
    expect(result).toHaveProperty("name", "db-query");
    expect(result).toHaveProperty("description", "Database Query");
    expect(typeof (result as Record<string, unknown>).value).toBe("number");
    expect((result as Record<string, unknown>).value).toBeGreaterThanOrEqual(
      40
    );
  });

  it("should return undefined for unknown metric names", () => {
    const result = endTime("nonexistent");
    expect(result).toBeUndefined();
  });

  it("should handle missing description gracefully", async () => {
    startTime("simple");
    await sleep(10);
    const result = endTime("simple");

    expect(result).toBeDefined();
    expect(result).toHaveProperty("name", "simple");
  });
});

describe("setMetric", () => {
  it("should accept a valid metric", () => {
    expect(() =>
      setMetric({
        name: "cache",
        value: [0, 0] as unknown as [number, number],
        description: "Cache hit",
      })
    ).not.toThrow();
  });
});

describe("trackTime", () => {
  it("should return the result of a sync function", async () => {
    const result = await trackTime("sync-op", () => 42);
    expect(result).toBe(42);
  });

  it("should return the result of an async function", async () => {
    const result = await trackTime("async-op", async () => {
      await sleep(30);
      return "done";
    });
    expect(result).toBe("done");
  });

  it("should accept a description parameter", async () => {
    const result = await trackTime(
      "described-op",
      async () => {
        await sleep(10);
        return 123;
      },
      "A described operation"
    );
    expect(result).toBe(123);
  });

  it("should propagate errors from the wrapped function", async () => {
    await expect(
      trackTime("failing-op", async () => {
        throw new Error("something broke");
      })
    ).rejects.toThrow("something broke");
  });

  it("should still record timing even when the function throws", async () => {
    // trackTime uses finally{} so endTime is always called
    // We just verify it doesn't hang or throw an unrelated error
    try {
      await trackTime("error-timing", async () => {
        await sleep(20);
        throw new Error("fail");
      });
    } catch {
      // expected
    }
  });

  it("should handle functions returning different types", async () => {
    const objResult = await trackTime("obj-op", async () => ({ key: "value" }));
    expect(objResult).toEqual({ key: "value" });

    const arrResult = await trackTime("arr-op", async () => [1, 2, 3]);
    expect(arrResult).toEqual([1, 2, 3]);

    const nullResult = await trackTime("null-op", async () => null);
    expect(nullResult).toBeNull();
  });
});

describe("Cold Start Detection", () => {
  beforeEach(() => {
    _resetColdStartState();
  });

  it("should detect cold start on first invocation", () => {
    expect(isColdStart()).toBe(true);
    expect(getColdStartDuration()).toBeNull();
  });

  it("should mark as warm after middleware before hook runs", () => {
    const middleware = withServerTimings({ enabled: true });
    expect(isColdStart()).toBe(true);

    middleware.before();

    expect(isColdStart()).toBe(false);
    expect(getColdStartDuration()).toBeGreaterThanOrEqual(0);
  });

  it("should not report cold start on subsequent invocations", () => {
    const middleware = withServerTimings({ enabled: true });

    // First invocation - cold start
    middleware.before();
    expect(isColdStart()).toBe(false);
    const firstDuration = getColdStartDuration();

    // Second invocation - warm
    middleware.before();
    expect(isColdStart()).toBe(false);
    // Duration should remain from first cold start
    expect(getColdStartDuration()).toBe(firstDuration);
  });

  it("should add cold-start metric to Server-Timing header when enabled", () => {
    const middleware = withServerTimings({ enabled: true });
    middleware.before();

    const handler = {
      response: {
        statusCode: 200,
        headers: {},
      },
    };

    middleware.after(handler as never);

    expect(handler.response.headers).toHaveProperty("Server-Timing");
    expect(
      (handler.response.headers as Record<string, string>)["Server-Timing"]
    ).toContain("cold-start");
  });

  it("should not add cold-start metric when trackColdStart is false", () => {
    const middleware = withServerTimings({
      enabled: true,
      trackColdStart: false,
    });
    middleware.before();

    const handler = {
      response: {
        statusCode: 200,
        headers: {},
      },
    };

    middleware.after(handler as never);

    expect(
      (handler.response.headers as Record<string, string>)["Server-Timing"]
    ).not.toContain("cold-start");
  });

  it("should track cold start even when middleware is disabled", () => {
    const middleware = withServerTimings({ enabled: false });
    expect(isColdStart()).toBe(true);

    middleware.before();

    expect(isColdStart()).toBe(false);
    expect(getColdStartDuration()).toBeGreaterThanOrEqual(0);
  });
});

describe("withServerTimings", () => {
  beforeEach(() => {
    _resetColdStartState();
  });

  it("should return a middleware with before and after hooks", () => {
    const middleware = withServerTimings({ enabled: true });
    expect(middleware).toHaveProperty("before");
    expect(middleware).toHaveProperty("after");
    expect(typeof middleware.before).toBe("function");
    expect(typeof middleware.after).toBe("function");
  });

  it("should return a no-op middleware when disabled", () => {
    const middleware = withServerTimings({ enabled: false });
    expect(middleware).toHaveProperty("after");

    // no-op should not throw
    middleware.after({} as never);
  });

  it("should return a no-op middleware when no options provided", () => {
    const middleware = withServerTimings();
    expect(middleware).toHaveProperty("after");
  });

  it("should add Server-Timing header to response when enabled", () => {
    const middleware = withServerTimings({ enabled: true });

    // Set a metric first
    setMetric({
      name: "test-metric",
      value: [0, 42] as unknown as [number, number],
    });

    const handler = {
      response: {
        statusCode: 200,
        headers: {},
      },
    };

    middleware.after(handler as never);

    expect(handler.response.headers).toHaveProperty("Server-Timing");
  });
});
