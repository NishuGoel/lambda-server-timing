import { getServerTimings, setMetric } from "./timers";

describe("timers", () => {
  describe("setMetric", () => {
    it("should set a metric", () => {
      setMetric({
        name: "jwm",
        description: "john wick metric",
        value: [1, 2],
      });
      setMetric({
        name: "ttk",
        description: "time to kill metric",
        value: [1, 2],
      });
      setMetric({
        name: "jjt",
        description: "jiu-jitsu metric",
        value: [1, 2],
      });
      setMetric({
        name: "rm",
        description: "randori judo metric",
        value: [1, 2],
      });

      expect(getServerTimings()).toEqual(
        [
          'jwm; dur=1,2; desc="john wick metric"',
          'ttk; dur=1,2; desc="time to kill metric"',
          'jjt; dur=1,2; desc="jiu-jitsu metric"',
          'rm; dur=1,2; desc="randori judo metric"',
        ].join(",")
      );
    });

    it("should not set metric if name is not a string", () => {
      setMetric({
        name: 1,
        description: "john wick metric",
        value: [1, 2],
      } as never);

      expect(getServerTimings()).toEqual("");
    });

    it("should not set metric if value is not an array of numbers", () => {
      setMetric({
        name: "john wick metric",
        description: "john wick metric",
        value: [1, "2"],
      } as never);

      expect(getServerTimings()).toEqual("");
    });

    it("should not set metric if value is not an array", () => {
      setMetric({
        name: "john wick metric",
        description: "john wick metric",
        value: "fractional bullet",
      } as never);

      expect(getServerTimings()).toEqual("");
    });
  });
});
