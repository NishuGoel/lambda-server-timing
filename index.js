"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMetric = exports.endTime = exports.trackTime = exports.startTime = exports.withServerTimings = exports._resetColdStartState = exports.getColdStartDuration = exports.isColdStart = void 0;
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
// Cold start detection - module-level state persists across warm invocations
const moduleLoadTime = process.hrtime();
let isWarm = false;
let coldStartDuration = null;
/**
 * @returns true if this is a cold start (first invocation in this Lambda container)
 */
const isColdStart = () => !isWarm;
exports.isColdStart = isColdStart;
/**
 * @returns the cold start duration in milliseconds, or null if not a cold start
 */
const getColdStartDuration = () => coldStartDuration;
exports.getColdStartDuration = getColdStartDuration;
/**
 * Resets cold start state and clears pending metrics. Useful for testing only.
 * @internal
 */
const _resetColdStartState = () => {
    isWarm = false;
    coldStartDuration = null;
    tempHeaders = [];
};
exports._resetColdStartState = _resetColdStartState;
/**
 * @returns a lambda middleware that adds a Server-Timing header to the response
 */
const withServerTimings = (opts) => {
    const trackColdStart = (opts === null || opts === void 0 ? void 0 : opts.trackColdStart) !== false;
    if (opts === null || opts === void 0 ? void 0 : opts.enabled) {
        return {
            // detect cold start at the beginning of request
            before: () => {
                if (trackColdStart && !isWarm) {
                    const initDuration = process.hrtime(moduleLoadTime);
                    coldStartDuration = initDuration[0] * 1e3 + initDuration[1] * 1e-6;
                    (0, exports.setMetric)({
                        name: "cold-start",
                        value: coldStartDuration,
                        description: "Lambda Cold Start",
                    });
                    isWarm = true;
                }
                else if (!isWarm) {
                    // Mark as warm even if not tracking
                    isWarm = true;
                }
            },
            // add Server-Timing header to response
            after: (handler) => {
                const response = handler.response;
                // get timings from request
                try {
                    const headers = [];
                    const timings = getServerTimingHeader(headers);
                    response.headers = Object.assign(Object.assign({}, response.headers), { "Server-Timing": timings });
                }
                catch (e) {
                    lambda_powertools_logger_1.default.debug(`Error: Could not record server timings - ${e}`);
                }
            },
        };
    }
    else {
        return {
            before: () => {
                if (!isWarm) {
                    const initDuration = process.hrtime(moduleLoadTime);
                    coldStartDuration = initDuration[0] * 1e3 + initDuration[1] * 1e-6;
                    isWarm = true;
                }
            },
            after: () => { },
        };
    }
};
exports.withServerTimings = withServerTimings;
/**
 * @param name
 * @param description
 * Records the start time of a metric
 */
const startTime = (name, description) => {
    try {
        if (typeof name !== "string") {
            return lambda_powertools_logger_1.default.debug("Metric name is not string");
        }
        timer(name, description);
    }
    catch (e) {
        lambda_powertools_logger_1.default.debug(`Error: Could not record start time ${name} - ${e}`);
    }
};
exports.startTime = startTime;
/**
 * @param name
 * @param description
 *
 * @returns TimeObject
 * Records the duration of a metric and sets a metric timing
 */
/**
 * @param name - Unique identifier for the metric
 * @param fn - Async function to time
 * @param description - Optional human-readable description
 *
 * @returns The return value of the provided function
 * Wraps an async function, automatically recording its duration as a metric
 */
const trackTime = (name, fn, description) => __awaiter(void 0, void 0, void 0, function* () {
    (0, exports.startTime)(name, description);
    try {
        const result = yield fn();
        return result;
    }
    finally {
        (0, exports.endTime)(name, description);
    }
});
exports.trackTime = trackTime;
const endTime = (name, description) => {
    var _a;
    try {
        if (typeof name !== "string") {
            return lambda_powertools_logger_1.default.debug("Metric name is not string");
        }
        const obj = timerEnd(name);
        if (!obj) {
            return;
        }
        (0, exports.setMetric)({
            name: obj.name,
            description: (_a = obj.description) !== null && _a !== void 0 ? _a : description,
            value: obj.value,
        });
        return obj;
    }
    catch (e) {
        lambda_powertools_logger_1.default.debug(`Error: Could not record end time for ${name} - ${e}`);
    }
};
exports.endTime = endTime;
const times = new Map();
const timer = (name, description) => {
    times.set(name, {
        name,
        description: description || "",
        startTime: process.hrtime(),
    });
};
const timerEnd = (name, description) => {
    const timeObj = times.get(name);
    if (!timeObj) {
        return lambda_powertools_logger_1.default.debug(`No such name ${name}`);
    }
    const duration = process.hrtime(timeObj.startTime);
    if (!timeObj.description) {
        timeObj.description = description;
    }
    const value = duration[0] * 1e3 + duration[1] * 1e-6;
    timeObj.value = value;
    times.delete(name);
    return timeObj;
};
let tempHeaders = [];
const setMetric = ({ name, value, description }) => {
    if (typeof name !== "string") {
        return lambda_powertools_logger_1.default.debug("1st argument name is not string");
    }
    if (typeof value !== "number") {
        return lambda_powertools_logger_1.default.debug("2nd argument value is not number");
    }
    const dur = value;
    const metric = typeof description !== "string" || !description
        ? `${name}; dur=${dur !== null && dur !== void 0 ? dur : 0}`
        : `${name}; dur=${dur}; desc="${description}"`;
    tempHeaders.push(metric);
};
exports.setMetric = setMetric;
const getServerTimingHeader = (headers) => {
    headers.push(tempHeaders === null || tempHeaders === void 0 ? void 0 : tempHeaders.toString());
    tempHeaders = [];
    return headers === null || headers === void 0 ? void 0 : headers.toString();
};
//# sourceMappingURL=index.js.map