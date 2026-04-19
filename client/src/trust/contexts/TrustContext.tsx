/**
 * Trust Context — UI state layer
 *
 * Performance
 * ───────────
 * State and actions live in separate contexts. Components that only dispatch
 * (e.g. a "Resolve Alert" button) do not re-render when state changes, and
 * components that only read state do not re-render because an action reference
 * changed. This eliminates the most common context-induced cascade.
 *
 * Type notes
 * ──────────
 * • TrustScore and FraudAlert are imported from their canonical sources.
 *   If the API shape diverges from what this context needs, introduce a
 *   local view-model type and map at the boundary — do not redeclare the
 *   type inline with `any` fields.
 * • VerificationEntry is a named type so the index-signature value is
 *   auditable and refactorable.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"

// Import canonical domain types rather than re-declaring them locally.
// Adjust paths to match your project structure.
import { type TrustScore } from "../types/trust.types"
import { type FraudAlert } from "../hooks/useFraudDetection"

// ─── Types ─────────────────────────────────────────────────────────────────────

export type VerificationStatus = "pending" | "verified" | "failed" | "expired"

export interface VerificationEntry {
  status: VerificationStatus
  lastChecked: string   // ISO-8601
  confidence: number    // 0–1
}

interface TrustState {
  trustScore: TrustScore | null
  fraudAlerts: FraudAlert[]
  verificationStatus: Record<string, VerificationEntry>
  isLoading: boolean
  error: string | null
}

interface TrustActions {
  updateTrustScore: (score: TrustScore) => void
  addFraudAlert: (alert: FraudAlert) => void
  resolveFraudAlert: (alertId: string) => void
  updateVerificationStatus: (propertyId: string, entry: VerificationEntry) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// ─── Reducer ───────────────────────────────────────────────────────────────────

type TrustAction =
  | { type: "UPDATE_TRUST_SCORE";         payload: TrustScore }
  | { type: "ADD_FRAUD_ALERT";            payload: FraudAlert }
  | { type: "RESOLVE_FRAUD_ALERT";        payload: string }
  | { type: "UPDATE_VERIFICATION_STATUS"; payload: { propertyId: string; entry: VerificationEntry } }
  | { type: "SET_LOADING";               payload: boolean }
  | { type: "SET_ERROR";                 payload: string | null }
  | { type: "CLEAR_ERROR" }

const initialState: TrustState = {
  trustScore:         null,
  fraudAlerts:        [],
  verificationStatus: {},
  isLoading:          false,
  error:              null,
}

function trustReducer(state: TrustState, action: TrustAction): TrustState {
  switch (action.type) {
    case "UPDATE_TRUST_SCORE":
      return { ...state, trustScore: action.payload, isLoading: false, error: null }

    case "ADD_FRAUD_ALERT":
      return { ...state, fraudAlerts: [...state.fraudAlerts, action.payload] }

    case "RESOLVE_FRAUD_ALERT":
      return {
        ...state,
        fraudAlerts: state.fraudAlerts.map((alert) =>
          alert.id === action.payload ? { ...alert, resolved: true } : alert
        ),
      }

    case "UPDATE_VERIFICATION_STATUS":
      return {
        ...state,
        verificationStatus: {
          ...state.verificationStatus,
          [action.payload.propertyId]: action.payload.entry,
        },
      }

    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false }

    case "CLEAR_ERROR":
      return { ...state, error: null }

    default:
      return state
  }
}

// ─── Contexts ──────────────────────────────────────────────────────────────────
// Splitting state and actions into separate contexts prevents action-only
// consumers from re-rendering on every state change.

const TrustStateContext   = createContext<TrustState    | undefined>(undefined)
const TrustActionsContext = createContext<TrustActions  | undefined>(undefined)

// ─── Provider ──────────────────────────────────────────────────────────────────

export function TrustProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(trustReducer, initialState)

  // Memoised action creators — stable references across renders.
  const updateTrustScore = useCallback(
    (score: TrustScore) =>
      dispatch({ type: "UPDATE_TRUST_SCORE", payload: score }),
    []
  )

  const addFraudAlert = useCallback(
    (alert: FraudAlert) =>
      dispatch({ type: "ADD_FRAUD_ALERT", payload: alert }),
    []
  )

  const resolveFraudAlert = useCallback(
    (alertId: string) =>
      dispatch({ type: "RESOLVE_FRAUD_ALERT", payload: alertId }),
    []
  )

  const updateVerificationStatus = useCallback(
    (propertyId: string, entry: VerificationEntry) =>
      dispatch({ type: "UPDATE_VERIFICATION_STATUS", payload: { propertyId, entry } }),
    []
  )

  const setLoading = useCallback(
    (loading: boolean) =>
      dispatch({ type: "SET_LOADING", payload: loading }),
    []
  )

  const setError = useCallback(
    (error: string | null) =>
      dispatch({ type: "SET_ERROR", payload: error }),
    []
  )

  const clearError = useCallback(
    () => dispatch({ type: "CLEAR_ERROR" }),
    []
  )

  // Actions object is stable as long as dispatch (always stable) doesn't change.
  const actions = useMemo<TrustActions>(
    () => ({
      updateTrustScore,
      addFraudAlert,
      resolveFraudAlert,
      updateVerificationStatus,
      setLoading,
      setError,
      clearError,
    }),
    [
      updateTrustScore,
      addFraudAlert,
      resolveFraudAlert,
      updateVerificationStatus,
      setLoading,
      setError,
      clearError,
    ]
  )

  return (
    <TrustStateContext.Provider value={state}>
      <TrustActionsContext.Provider value={actions}>
        {children}
      </TrustActionsContext.Provider>
    </TrustStateContext.Provider>
  )
}

// ─── Consumer hooks ────────────────────────────────────────────────────────────

/** Read trust state. Re-renders when any state field changes. */
export function useTrustState(): TrustState {
  const ctx = useContext(TrustStateContext)
  if (ctx === undefined) {
    throw new Error("useTrustState must be used within a TrustProvider")
  }
  return ctx
}

/** Access trust actions. Never re-renders due to state changes. */
export function useTrustActions(): TrustActions {
  const ctx = useContext(TrustActionsContext)
  if (ctx === undefined) {
    throw new Error("useTrustActions must be used within a TrustProvider")
  }
  return ctx
}

/**
 * Convenience hook — returns both state and actions.
 * Use only in components that need both; prefer the focused hooks above
 * when a component only reads or only writes.
 */
export function useTrustContext(): TrustState & TrustActions {
  return { ...useTrustState(), ...useTrustActions() }
}