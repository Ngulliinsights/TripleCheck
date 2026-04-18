/**
 * Toast Notification Hook
 *
 * Module-level state with subscriber pattern keeps all hook instances
 * in sync without a context provider.
 */

import * as React from 'react'
import type { ToastActionElement, ToastProps } from '../components/ui/toast'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOAST_LIMIT        = 1;
const TOAST_REMOVE_DELAY = 1_000_000; // ms — deliberately long; dismiss is manual

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToasterToast = ToastProps & {
  id:           string;
  title?:       React.ReactNode;
  description?: React.ReactNode;
  action?:      ToastActionElement;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ActionType = {
  ADD_TOAST:     'ADD_TOAST',
  UPDATE_TOAST:  'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST:  'REMOVE_TOAST',
} as const;

type Action =
  | { type: 'ADD_TOAST';     toast:  ToasterToast }
  | { type: 'UPDATE_TOAST';  toast:  Partial<ToasterToast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST';  toastId?: string };

interface State { toasts: ToasterToast[] }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

// Reduce statement
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };

    case 'UPDATE_TOAST':
      return { ...state, toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t) };

    case 'DISMISS_TOAST': {
      const { toastId } = action;
      if (toastId) scheduleRemoval(toastId); else state.toasts.forEach((t) => scheduleRemoval(t.id));
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t,
        ),
      };
    }

    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        removeTimeouts.forEach(clearTimeout);
        removeTimeouts.clear();
        return { ...state, toasts: [] };
      }
      cancelRemoval(action.toastId);
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Module-level store
// ---------------------------------------------------------------------------

let   idCounter    = 0;
const genId        = () => String((idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER));

const removeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
let   memoryState: State = { toasts: [] };
const listeners:   Array<(state: State) => void> = [];

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function scheduleRemoval(id: string) {
  if (removeTimeouts.has(id)) return;
  removeTimeouts.set(id, setTimeout(() => {
    removeTimeouts.delete(id);
    dispatch({ type: 'REMOVE_TOAST', toastId: id });
  }, TOAST_REMOVE_DELAY));
}

function cancelRemoval(id: string) {
  const t = removeTimeouts.get(id);
  if (t) { clearTimeout(t); removeTimeouts.delete(id); }
}

// ---------------------------------------------------------------------------
// toast() — fire-and-forget API
// ---------------------------------------------------------------------------

type ToastInput = Omit<ToasterToast, 'id'>;

interface ToastHandle { id: string; dismiss: () => void; update: (props: Partial<ToasterToast>) => void }

export function toast(props: ToastInput): ToastHandle {
  const id      = genId();
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });
  const update  = (p: Partial<ToasterToast>) => dispatch({ type: 'UPDATE_TOAST', toast: { ...p, id } });

  dispatch({
    type:  'ADD_TOAST',
    toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss(); } },
  });

  return { id, dismiss, update };
}

// ---------------------------------------------------------------------------
// useToast
// ---------------------------------------------------------------------------

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  const dismiss = React.useCallback(
    (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', ...(toastId ? { toastId } : {}) }),
    [],
  );

  return { ...state, toast, dismiss };
}

// ---------------------------------------------------------------------------
// Module cleanup (useful for testing / HMR)
// ---------------------------------------------------------------------------

export function cleanup() {
  removeTimeouts.forEach(clearTimeout);
  removeTimeouts.clear();
  listeners.length = 0;
  memoryState      = { toasts: [] };
}