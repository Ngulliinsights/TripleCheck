import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface TrustScore {
  overall: number;
  documentVerification: number;
  communityFeedback: number;
  transactionHistory: number;
  expertValidation: number;
}

interface FraudAlert {
  id: string;
  propertyId: string;
  type: 'document' | 'ownership' | 'financial' | 'community';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface TrustState {
  trustScore: TrustScore | null;
  fraudAlerts: FraudAlert[];
  verificationStatus: {
    [propertyId: string]: {
      status: 'pending' | 'verified' | 'failed' | 'expired';
      lastChecked: string;
      confidence: number;
    };
  };
  isLoading: boolean;
  error: string | null;
}

interface TrustContextType extends TrustState {
  updateTrustScore: (score: TrustScore) => void;
  addFraudAlert: (alert: FraudAlert) => void;
  resolveFraudAlert: (alertId: string) => void;
  updateVerificationStatus: (propertyId: string, status: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type TrustAction =
  | { type: 'UPDATE_TRUST_SCORE'; payload: TrustScore }
  | { type: 'ADD_FRAUD_ALERT'; payload: FraudAlert }
  | { type: 'RESOLVE_FRAUD_ALERT'; payload: string }
  | { type: 'UPDATE_VERIFICATION_STATUS'; payload: { propertyId: string; status: any } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const initialState: TrustState = {
  trustScore: null,
  fraudAlerts: [],
  verificationStatus: {},
  isLoading: false,
  error: null,
};

const trustReducer = (state: TrustState, action: TrustAction): TrustState => {
  switch (action.type) {
    case 'UPDATE_TRUST_SCORE':
      return {
        ...state,
        trustScore: action.payload,
        isLoading: false,
        error: null,
      };
    case 'ADD_FRAUD_ALERT':
      return {
        ...state,
        fraudAlerts: [...state.fraudAlerts, action.payload],
      };
    case 'RESOLVE_FRAUD_ALERT':
      return {
        ...state,
        fraudAlerts: state.fraudAlerts.map(alert =>
          alert.id === action.payload
            ? { ...alert, resolved: true }
            : alert
        ),
      };
    case 'UPDATE_VERIFICATION_STATUS':
      return {
        ...state,
        verificationStatus: {
          ...state.verificationStatus,
          [action.payload.propertyId]: action.payload.status,
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const TrustContext = createContext<TrustContextType | undefined>(undefined);

interface TrustProviderProps {
  children: ReactNode;
}

export const TrustProvider: React.FC<TrustProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(trustReducer, initialState);

  const updateTrustScore = (score: TrustScore): void => {
    dispatch({ type: 'UPDATE_TRUST_SCORE', payload: score });
  };

  const addFraudAlert = (alert: FraudAlert): void => {
    dispatch({ type: 'ADD_FRAUD_ALERT', payload: alert });
  };

  const resolveFraudAlert = (alertId: string): void => {
    dispatch({ type: 'RESOLVE_FRAUD_ALERT', payload: alertId });
  };

  const updateVerificationStatus = (propertyId: string, status: any): void => {
    dispatch({ 
      type: 'UPDATE_VERIFICATION_STATUS', 
      payload: { propertyId, status } 
    });
  };

  const setLoading = (loading: boolean): void => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null): void => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: TrustContextType = {
    ...state,
    updateTrustScore,
    addFraudAlert,
    resolveFraudAlert,
    updateVerificationStatus,
    setLoading,
    setError,
    clearError,
  };

  return (
    <TrustContext.Provider value={value}>
      {children}
    </TrustContext.Provider>
  );
};

export const useTrustContext = (): TrustContextType => {
  const context = useContext(TrustContext);
  if (context === undefined) {
    throw new Error('useTrustContext must be used within a TrustProvider');
  }
  return context;
};