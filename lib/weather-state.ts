"use client";

import type { Condition } from "@/lib/weather-codes";

let currentCondition: Condition = "partly-cloudy";
let currentIsNight = false;
const listeners = new Set<() => void>();

export const weatherState = {
  getCondition(): Condition {
    return currentCondition;
  },
  getIsNight(): boolean {
    return currentIsNight;
  },
  setWeather(condition: Condition, isNight: boolean) {
    if (currentCondition !== condition || currentIsNight !== isNight) {
      currentCondition = condition;
      currentIsNight = isNight;
      for (const listener of listeners) {
        listener();
      }
    }
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
