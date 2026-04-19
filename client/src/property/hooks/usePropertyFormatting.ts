import { useMemo, useCallback } from "react"

import type { NormalizedProperty } from '@shared/types/property'
import { useSafeQuery } from "./useSafeQuery"

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

interface ExchangeRatesResponse {
  /** KES → USD rate (units: KES per 1 USD) */
  KESUSD: number;
  KESGBP: number;
  KESEUR: number;
}

interface GeocodingResponse {
  lat: number;
  lng: number;
  accuracy: number;
  timezone: string;
}

interface MarketAnalysisResponse {
  location?: {
    averagePrice: number;
    pricePerSqft: number;
    appreciation: number;
    liquidity: 'high' | 'medium' | 'low';
  };
  priceTrend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
    confidence: number;
  };
  market?: {
    competitiveness: number;
    demandLevel: 'high' | 'medium' | 'low';
    supplyLevel: 'high' | 'medium' | 'low';
    score: number;
    comparables: number;
  };
  investment?: {
    roi: number;
    paybackPeriod: number;
    cashFlow: number;
    appreciation: number;
  };
}

// Extended property type with condition
interface ExtendedProperty extends Omit<NormalizedProperty, 'category'> {
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  category?: 'residential' | 'commercial' | 'land' | string;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface FormattedPrice {
  primary: string;
  secondary?: string;
  hasDiscount: boolean;
  discountPercentage: number;
  originalPrice?: number;
  regional?: string;
  enterpriseDiscount?: {
    amount: number;
    percentage: number;
    type: 'bulk' | 'seasonal' | 'loyalty' | 'market';
    validUntil?: Date;
  };
  formattedWithTax?: string;
  priceHistory?: Array<{ date: string; price: number; change: number }>;
}

export interface EnterpriseLocation {
  address: string;
  geocoded?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timezone: string;
  };
  nearby?: {
    schools: Array<{ name: string; distance: number; rating: number }>;
    hospitals: Array<{ name: string; distance: number; type: string }>;
    transport: Array<{ name: string; distance: number; type: string }>;
    amenities: Array<{ name: string; distance: number; category: string }>;
  };
  travelTime?: { toCBD: number; toAirport: number; toMajorRoads: number };
  marketData?: {
    averagePrice: number;
    pricePerSqft: number;
    appreciation: number;
    liquidity: 'high' | 'medium' | 'low';
  };
}

export interface EnterpriseInsights {
  priceTrend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
    confidence: number;
  };
  marketAnalysis: {
    competitiveness: number;
    demandLevel: 'high' | 'medium' | 'low';
    supplyLevel: 'high' | 'medium' | 'low';
    marketScore: number;
    comparables: number;
  };
  riskScore: {
    overall: number;
    factors: { location: number; market: number; property: number; economic: number };
    recommendation: 'buy' | 'hold' | 'avoid';
  };
  investmentMetrics?: {
    roi: number;
    paybackPeriod: number;
    cashFlow: number;
    appreciation: number;
  };
}

export interface UsePropertyFormattingReturn {
  formattedPrice: FormattedPrice;
  locationString: string;
  displayTitle: string;
  displayDescription: string;
  enterpriseLocation: EnterpriseLocation;
  enterpriseInsights: EnterpriseInsights;
  formatPriceForRegion: (region: string) => string;
  calculateAffordability: (income: number) => {
    affordable: boolean;
    monthlyPayment: number;
    downPayment: number;
    loanAmount: number;
  };
}

// ---------------------------------------------------------------------------
// Module helpers
// ---------------------------------------------------------------------------

/** Returns the user's locale, falling back to 'en-KE'. SSR-safe. */
const getRegionalLocale = (): string => {
  const userLocale = (typeof navigator !== 'undefined' ? navigator.language : null) ?? 'en-KE';
  const supported = ['en-KE', 'sw-KE', 'en-US', 'en-GB'];
  return supported.includes(userLocale) ? userLocale : 'en-KE';
};

const calculateEnterpriseDiscount = (
  originalPrice: number,
  currentPrice: number,
): FormattedPrice['enterpriseDiscount'] => {
  if (!originalPrice || originalPrice <= currentPrice) return undefined;

  const amount = originalPrice - currentPrice;
  const percentage = Math.round((amount / originalPrice) * 100);

  let type: 'bulk' | 'seasonal' | 'loyalty' | 'market' = 'market';
  if (percentage > 20) type = 'bulk';
  else if (percentage > 10) type = 'seasonal';
  else if (percentage > 5) type = 'loyalty';

  return {
    amount,
    percentage,
    type,
    // Discount offer expires in 30 days
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
};

const formatKES = (amount: number): string =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);

const includeTaxCalculation = (price: number): string =>
  formatKES(price * 1.16); // 16 % VAT (Kenya)

/**
 * Returns estimated travel times in minutes based on known Nairobi area names.
 * TODO: Replace with a real Maps API call in production.
 */
const calculateTravelTime = (location: string): EnterpriseLocation['travelTime'] => {
  const loc = location.toLowerCase();

  if (loc.includes('westlands') || loc.includes('kilimani')) {
    return { toCBD: 20, toAirport: 45, toMajorRoads: 5 };
  }
  if (loc.includes('karen') || loc.includes('langata')) {
    return { toCBD: 35, toAirport: 30, toMajorRoads: 10 };
  }
  if (loc.includes('kiambu') || loc.includes('thika')) {
    return { toCBD: 60, toAirport: 90, toMajorRoads: 20 };
  }

  return { toCBD: 45, toAirport: 60, toMajorRoads: 15 };
};

/** Coerces a property price value to a number, returning NaN when unparseable. */
const toNumericPrice = (price: NormalizedProperty['price']): number =>
  typeof price === 'string' ? parseFloat(price) : (price ?? NaN);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Shared hook for formatting property data with optional enterprise features.
 * Used by PropertyCard, EnhancedLandCard, and enterprise property components.
 */
export function usePropertyFormatting(
  property: ExtendedProperty,
  options?: {
    originalPrice?: number;
    showUSDConversion?: boolean;
    /** Fallback KES → USD rate used when the exchange-rate API is unavailable. */
    exchangeRate?: number;
    enableEnterpriseFeatures?: boolean;
  }
): UsePropertyFormattingReturn {
  const {
    originalPrice,
    showUSDConversion = true,
    exchangeRate = 130,
    enableEnterpriseFeatures = true,
  } = options ?? {};

  // --- Remote data -----------------------------------------------------------

  const { data: exchangeRates } = useSafeQuery<ExchangeRatesResponse>({
    endpoint: '/api/exchange-rates',
    method: 'GET',
    fallbackData: { KESUSD: exchangeRate, KESGBP: 165, KESEUR: 140 },
    staleTime: 5 * 60 * 1000,
    enabled: enableEnterpriseFeatures,
    context: 'exchange-rates',
  });

  const { data: geocodingData } = useSafeQuery<GeocodingResponse | null>({
    endpoint: `/api/geocoding?address=${encodeURIComponent(property.location?.toString() ?? '')}`,
    method: 'GET',
    fallbackData: null,
    staleTime: 60 * 60 * 1000,
    enabled: enableEnterpriseFeatures && Boolean(property.location),
    context: 'geocoding',
  });

  const { data: marketData } = useSafeQuery<MarketAnalysisResponse | null>({
    endpoint: `/api/market-analysis?propertyId=${property.id}`,
    method: 'GET',
    fallbackData: null,
    staleTime: 30 * 60 * 1000,
    enabled: enableEnterpriseFeatures && Boolean(property.id),
    context: 'market-analysis',
  });

  // --- Derived values --------------------------------------------------------

  const locationString = useMemo(() => {
    if (typeof property.location === 'string') return property.location;
    if (property.location && typeof property.location === 'object' && 'address' in property.location) {
      return (property.location as { address?: string }).address ?? 'Location not specified';
    }
    return 'Location not specified';
  }, [property.location]);

  const formattedPrice = useMemo((): FormattedPrice => {
    const numericPrice = toNumericPrice(property.price);

    if (!numericPrice || isNaN(numericPrice)) {
      return {
        primary: 'Price on request',
        hasDiscount: false,
        discountPercentage: 0,
      };
    }

    const realTimeRate = exchangeRates?.KESUSD ?? exchangeRate;
    const primaryFormatted = formatKES(numericPrice);
    const regional = new Intl.NumberFormat(getRegionalLocale(), {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numericPrice);

    const secondary = showUSDConversion
      ? `~${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(Math.round(numericPrice / realTimeRate))}`
      : undefined;

    const hasDiscount = Boolean(originalPrice && originalPrice > numericPrice);
    const discountPercentage = hasDiscount && originalPrice
      ? Math.round(((originalPrice - numericPrice) / originalPrice) * 100)
      : 0;

    return {
      primary: primaryFormatted,
      secondary,
      hasDiscount,
      discountPercentage,
      originalPrice,
      regional,
      enterpriseDiscount: enableEnterpriseFeatures
        ? calculateEnterpriseDiscount(originalPrice ?? 0, numericPrice)
        : undefined,
      formattedWithTax: enableEnterpriseFeatures
        ? includeTaxCalculation(numericPrice)
        : undefined,
      // TODO: Replace with real price-history API data.
      priceHistory: enableEnterpriseFeatures ? [
        { date: '2024-01', price: numericPrice * 0.95, change: -5 },
        { date: '2024-02', price: numericPrice * 0.98, change: 3 },
        { date: '2024-03', price: numericPrice, change: 2 },
      ] : undefined,
    };
  }, [
    property.price,
    originalPrice,
    showUSDConversion,
    exchangeRate,
    exchangeRates,
    enableEnterpriseFeatures,
  ]);

  const enterpriseLocation = useMemo((): EnterpriseLocation => {
    const base: EnterpriseLocation = { address: locationString };

    if (!enableEnterpriseFeatures) return base;

    if (geocodingData) {
      base.geocoded = {
        latitude: geocodingData.lat ?? 0,
        longitude: geocodingData.lng ?? 0,
        accuracy: geocodingData.accuracy ?? 0,
        timezone: geocodingData.timezone ?? 'Africa/Nairobi',
      };
    }

    // TODO: Replace with Google Places API for accurate nearby data.
    base.nearby = {
      schools: [
        { name: 'Nairobi School', distance: 2.5, rating: 4.5 },
        { name: 'Alliance High School', distance: 5.0, rating: 4.8 },
      ],
      hospitals: [
        { name: 'Nairobi Hospital', distance: 3.2, type: 'Private' },
        { name: 'Kenyatta Hospital', distance: 8.1, type: 'Public' },
      ],
      transport: [
        { name: 'Westlands Bus Station', distance: 1.5, type: 'Bus' },
        { name: 'Nairobi Railway Station', distance: 12.0, type: 'Train' },
      ],
      amenities: [
        { name: 'Sarit Centre', distance: 2.0, category: 'Shopping' },
        { name: 'Karura Forest', distance: 4.5, category: 'Recreation' },
      ],
    };

    base.travelTime = calculateTravelTime(locationString);

    if (marketData?.location) {
      base.marketData = {
        averagePrice: marketData.location.averagePrice ?? 0,
        pricePerSqft: marketData.location.pricePerSqft ?? 0,
        appreciation: marketData.location.appreciation ?? 0,
        liquidity: marketData.location.liquidity ?? 'medium',
      };
    }

    return base;
  }, [locationString, enableEnterpriseFeatures, geocodingData, marketData]);

  const displayTitle = useMemo(() => property.title?.trim() || 'Untitled Property', [property.title]);
  const displayDescription = useMemo(() => property.description?.trim() ?? '', [property.description]);

  // Depend on individual fields rather than the whole property object to avoid
  // spurious recomputation when unrelated fields change.
  const enterpriseInsights = useMemo((): EnterpriseInsights => {
    const empty: EnterpriseInsights = {
      priceTrend: { direction: 'stable', percentage: 0, period: '3M', confidence: 0 },
      marketAnalysis: { competitiveness: 0, demandLevel: 'medium', supplyLevel: 'medium', marketScore: 0, comparables: 0 },
      riskScore: { overall: 0, factors: { location: 0, market: 0, property: 0, economic: 0 }, recommendation: 'hold' },
    };

    if (!enableEnterpriseFeatures) return empty;

    const priceTrend = {
      direction: (marketData?.priceTrend?.direction ?? 'stable') as 'up' | 'down' | 'stable',
      percentage: marketData?.priceTrend?.percentage ?? 0,
      period: marketData?.priceTrend?.period ?? '3M',
      confidence: marketData?.priceTrend?.confidence ?? 75,
    };

    const marketAnalysis = {
      competitiveness: marketData?.market?.competitiveness ?? 75,
      demandLevel: (marketData?.market?.demandLevel ?? 'medium') as 'high' | 'medium' | 'low',
      supplyLevel: (marketData?.market?.supplyLevel ?? 'medium') as 'high' | 'medium' | 'low',
      marketScore: marketData?.market?.score ?? 80,
      comparables: marketData?.market?.comparables ?? 15,
    };

    const locationRisk = enterpriseLocation.travelTime
      ? Math.max(0, 100 - enterpriseLocation.travelTime.toCBD * 2)
      : 70;
    const marketRisk = marketAnalysis.marketScore;
    const propertyRisk =
      property.condition === 'excellent' ? 90 :
      property.condition === 'good' ? 75 : 60;
    const economicRisk = 75; // TODO: Wire up a real economic indicator.

    const overallRisk = Math.round((locationRisk + marketRisk + propertyRisk + economicRisk) / 4);

    const numericPrice = toNumericPrice(property.price);
    const investmentMetrics: EnterpriseInsights['investmentMetrics'] = numericPrice && !isNaN(numericPrice)
      ? {
          roi: marketData?.investment?.roi ?? 8.5,
          paybackPeriod: marketData?.investment?.paybackPeriod ?? 12,
          cashFlow: marketData?.investment?.cashFlow ?? numericPrice * 0.05,
          appreciation: marketData?.investment?.appreciation ?? 6.2,
        }
      : undefined;

    return {
      priceTrend,
      marketAnalysis,
      riskScore: {
        overall: overallRisk,
        factors: { location: locationRisk, market: marketRisk, property: propertyRisk, economic: economicRisk },
        recommendation: overallRisk > 80 ? 'buy' : overallRisk > 60 ? 'hold' : 'avoid',
      },
      investmentMetrics,
    };
  }, [
    enableEnterpriseFeatures,
    marketData,
    property.price,
    property.condition,
    enterpriseLocation,
  ]);

  const formatPriceForRegion = useCallback((region: string) => {
    const numericPrice = toNumericPrice(property.price);
    if (!numericPrice || isNaN(numericPrice)) return 'Price on request';

    const regionMap: Record<string, { locale: string; currency: string; rate: number }> = {
      kenya:  { locale: 'en-KE', currency: 'KES', rate: 1 },
      usa:    { locale: 'en-US', currency: 'USD', rate: exchangeRates?.KESUSD ?? exchangeRate },
      uk:     { locale: 'en-GB', currency: 'GBP', rate: exchangeRates?.KESGBP ?? 165 },
      europe: { locale: 'de-DE', currency: 'EUR', rate: exchangeRates?.KESEUR ?? 140 },
    };

    const config = regionMap[region.toLowerCase()] ?? regionMap['kenya']!;

    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 0,
    }).format(numericPrice / config.rate);
  }, [property.price, exchangeRates, exchangeRate]);

  const calculateAffordability = useCallback((income: number) => {
    const numericPrice = toNumericPrice(property.price);
    if (!numericPrice || isNaN(numericPrice) || !income) {
      return { affordable: false, monthlyPayment: 0, downPayment: 0, loanAmount: 0 };
    }

    const downPaymentPct = 0.20;  // 20 % down payment
    const annualRate     = 0.12;  // 12 % annual interest (Kenya typical)
    const termYears      = 25;

    const downPayment = numericPrice * downPaymentPct;
    const loanAmount  = numericPrice - downPayment;
    const monthlyRate = annualRate / 12;
    const n           = termYears * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) /
                           (Math.pow(1 + monthlyRate, n) - 1);

    // Housing cost should not exceed 30 % of gross monthly income.
    const affordable = monthlyPayment <= (income * 0.30) / 12;

    return {
      affordable,
      monthlyPayment: Math.round(monthlyPayment),
      downPayment: Math.round(downPayment),
      loanAmount: Math.round(loanAmount),
    };
  }, [property.price]);

  return {
    formattedPrice,
    locationString,
    displayTitle,
    displayDescription,
    enterpriseLocation,
    enterpriseInsights,
    formatPriceForRegion,
    calculateAffordability,
  };
}

export default usePropertyFormatting;