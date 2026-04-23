"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useReducer } from "react";
import { AppState, Group, ManualAdjustment, SoloExpense, Transaction } from "@/data/types";
import { loadState, saveState } from "@/data/storage";

type Action =
  | { type: "INIT"; payload: AppState }
  | { type: "ADD_GROUP"; payload: Group }
  | { type: "ADD_TX"; payload: Transaction }
  | { type: "ADD_ADJUSTMENT"; payload: ManualAdjustment }
  | { type: "ADD_SOLO"; payload: SoloExpense }
  | { type: "DELETE_SOLO"; payload: string };

const initialState: AppState = {
  groups: [],
  transactions: [],
  adjustments: [],
  soloExpenses: [],
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "INIT":
      return action.payload;
    case "ADD_GROUP":
      return { ...state, groups: [action.payload, ...state.groups] };
    case "ADD_TX":
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case "ADD_ADJUSTMENT":
      return { ...state, adjustments: [action.payload, ...state.adjustments] };
    case "ADD_SOLO":
      return { ...state, soloExpenses: [action.payload, ...state.soloExpenses] };
    case "DELETE_SOLO":
      return { ...state, soloExpenses: state.soloExpenses.filter((e) => e.id !== action.payload) };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  addGroup: (group: Group) => void;
  addTransaction: (tx: Transaction) => void;
  addAdjustment: (adjustment: ManualAdjustment) => void;
  addSoloExpense: (expense: SoloExpense) => void;
  deleteSoloExpense: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: "INIT", payload: loadState() });
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      addGroup: (group) => dispatch({ type: "ADD_GROUP", payload: group }),
      addTransaction: (tx) => dispatch({ type: "ADD_TX", payload: tx }),
      addAdjustment: (adjustment) => dispatch({ type: "ADD_ADJUSTMENT", payload: adjustment }),
      addSoloExpense: (expense) => dispatch({ type: "ADD_SOLO", payload: expense }),
      deleteSoloExpense: (id) => dispatch({ type: "DELETE_SOLO", payload: id }),
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
