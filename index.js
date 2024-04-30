"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMetric = exports.endTime = exports.startTime = exports.withServerTimings = void 0;
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
/**
 * @returns a lambda middleware that adds a Server-Timing header to the response
 */
const withServerTimings = (opts) => {
    if (opts === null || opts === void 0 ? void 0 : opts.enabled) {
        return {
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
 * Records the duration of a metric and sets a metric timing
 */
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