import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api-client';
import { useAuth } from '../../auth/hooks/useAuth';

interface PaymentGuidanceData {
  mpesa: {
    name: string;
    maxRecommendedAmount: number;
    warnings: string[];
    suitableFor: string[];
    notSuitableFor: string[];
  };
  bankTransfer: {
    name: string;
    suitableFor: string[];
    advantages: string[];
  };
  escrow: {
    name: string;
    suitableFor: string[];
    advantages: string[];
  };
}

interface UsePaymentGuidanceReturn {
  guidance: PaymentGuidanceData | null;
  loading: boolean;
  error: string | null;
  getRecommendedMethod: (amount: number, transactionType: string) => string;
  isAmountSafeForMpesa: (amount: number) => boolean;
}

export function usePaymentGuidance(): UsePaymentGuidanceReturn {
  const [guidance, setGuidance] = useState<PaymentGuidanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only fetch payment guidance for authenticated users
    if (!isAuthenticated) {
      setLoading(false);
      setError('Authentication required for payment guidance');
      return;
    }

    const controller = new AbortController();
    
    const fetchGuidance = async () => {
      try {
        const response = await apiClient.get('/payments/guidance', {
          signal: controller.signal,
          cache: true,
          cacheKey: 'payment-guidance',
          timeout: 5000,
          retries: 2
        });
        
        if (response.success) {
          setGuidance(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch payment guidance');
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGuidance();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated]);

  const getRecommendedMethod = (amount: number, transactionType: string): string => {
    if (transactionType.includes('property') || transactionType.includes('purchase') || transactionType.includes('deposit')) {
      return amount > 50000 ? 'escrow' : 'bankTransfer';
    }
    
    if (amount <= 10000) {
      return 'mpesa';
    }
    
    return 'bankTransfer';
  };

  const isAmountSafeForMpesa = (amount: number): boolean => {
    return amount <= (guidance?.mpesa.maxRecommendedAmount || 10000);
  };

  return {
    guidance,
    loading,
    error,
    getRecommendedMethod,
    isAmountSafeForMpesa
  };
}

export default usePaymentGuidance;