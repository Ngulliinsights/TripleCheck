/**
 * Payment Guidance Hook
 *
 * Fetches M-Pesa (cspell:disable-next-line) / bank-transfer / escrow guidance and exposes helpers
 * for recommending the right payment method.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { apiClient } from '../../local/services/unified-api-client'

// cspell:disable-next-line
interface MpesaGuidance {
  name:                   string;
  maxRecommendedAmount:   number;
  warnings:               string[];
  suitableFor:            string[];
  notSuitableFor:         string[];
}

interface PaymentGuidanceData {
  // cspell:disable-next-line
  mpesa:        MpesaGuidance;
  bankTransfer: { name: string; suitableFor: string[]; advantages: string[] };
  escrow:       { name: string; suitableFor: string[]; advantages: string[] };
}

// cspell:disable-next-line
export type PaymentMethod = 'mpesa' | 'bankTransfer' | 'escrow';

interface UsePaymentGuidanceReturn {
  guidance:               PaymentGuidanceData | null;
  loading:                boolean;
  error:                  string | null;
  getRecommendedMethod:   (amount: number, transactionType: string) => PaymentMethod;
  // cspell:disable-next-line
  isAmountSafeForMpesa:   (amount: number) => boolean;
}

// cspell:disable-next-line
const MPESA_SAFE_THRESHOLD = 10_000;

export function usePaymentGuidance(): UsePaymentGuidanceReturn {
  const [guidance, setGuidance] = useState<PaymentGuidanceData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const { isAuthenticated }     = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setError('Authentication required for payment guidance');
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const response = await apiClient.get('/payments/guidance', {
          signal:   controller.signal,
          cacheKey: 'payment-guidance',
          timeout:  5_000,
          retries:  2,
        } as Parameters<typeof apiClient.get>[1]);

        // Type guard for API response
        if (response && typeof response === 'object' && 'data' in response) {
          const typedResponse = response as { data?: PaymentGuidanceData };
          if (typedResponse.data) {
            setGuidance(typedResponse.data);
          } else {
            throw new Error('Failed to fetch payment guidance');
          }
        } else {
          throw new Error('Invalid payment guidance response');
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError')
          setError(err.message);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [isAuthenticated]);

  const getRecommendedMethod = (amount: number, transactionType: string): PaymentMethod => {
    const isLargeTransaction =
      transactionType.includes('property') ||
      transactionType.includes('purchase') ||
      transactionType.includes('deposit');

    if (isLargeTransaction) return amount > 50_000 ? 'escrow' : 'bankTransfer';
    return amount <= MPESA_SAFE_THRESHOLD ? 'mpesa' : 'bankTransfer';
  };

  // cspell:disable-next-line
  const isAmountSafeForMpesa = (amount: number) =>
    amount <= (guidance?.mpesa.maxRecommendedAmount ?? MPESA_SAFE_THRESHOLD);

  return { guidance, loading, error, getRecommendedMethod, isAmountSafeForMpesa };
}

export default usePaymentGuidance;