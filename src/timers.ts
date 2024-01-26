import type { TimeObject, Tuple } from "./types";

/* eslint-disable no-console */
const times = new Map<string, Record<string, unknown>>();

const timer = (name: string, description?: string) => {
  times.set(name, {
    name,
    description: description || "",
    startTime: process.hrtime(),
  });
};

/**
 * @param name
 * @param description
 * Records the start time of a metric
 */
export const startTime = (name: string, description?: string) => {
  try {
    if (typeof name !== "string") {
      console.warn("Metric name is not string");
      return;
    }

    timer(name, description);
  } catch (e) {
    console.warn(`Error: Could not record start time ${name} - ${e}`);
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
      console.warn("Metric name is not string");
      return;
    }

    const obj = timerEnd(name);
    if (!obj) {
      return;
    }
    setMetric({
      name: obj.name as string,
      description: (obj.description as string) ?? description,
      value: obj.value as Tuple,
    });
  } catch (e) {
    console.warn(`Error: Could not record end time for ${name} - ${e}`);
  }
};

const timerEnd = (name: string, description?: string) => {
  const timeObj = times.get(name);
  if (!timeObj) {
    console.warn(`No such name ${name}`);
    return;
  }
  const duration = process.hrtime(timeObj.startTime as Tuple);
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
    // eslint-disable-next-line no-console
    console.warn("setMetric::{name} argument is not a string");
    return;
  }
  if (
    (!Array.isArray(value) && typeof value !== "number") ||
    (Array.isArray(value) &&
      (typeof value?.[0] !== "number" || typeof value?.[1] !== "number"))
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "setMetric::value argument is not a number or [number, number]"
    );
    return;
  }

  const dur = value;

  const metric =
    typeof description !== "string" || !description
      ? `${name}; dur=${dur ?? 0}`
      : `${name}; dur=${dur}; desc="${description}"`;

  tempHeaders.push(metric);
};

export const getServerTimings = (headers?: unknown[]) => {
  const resultHeaders = headers || [];

  resultHeaders.push(tempHeaders?.toString());
  tempHeaders = [];

  return resultHeaders?.toString();
};
