import { AppState } from "@/data/types";

const KEY = "flowsplit-state-v1";

const defaultState: AppState = {
  groups: [],
  transactions: [],
  adjustments: [],
  soloExpenses: [],
};

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return defaultState;
  try {
    return { ...defaultState, ...(JSON.parse(raw) as Partial<AppState>) };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
