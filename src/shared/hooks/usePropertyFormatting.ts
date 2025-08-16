import { useMemo, useCallback } from "react";

import type { NormalizedProperty } from "../types/property";
import { useSafeQuery } from "./useSafeQuery";

// API response types
interface ExchangeRatesResponse {
    KESUSDT: number;
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
    category?: "residential" | "commercial" | "land" | string;
}

export interface FormattedPrice {
    primary: string;
    secondary?: string | undefined;
    hasDiscount: boolean;
    discountPercentage: number;
    originalPrice?: number | undefined;
    // Enterprise features
    regional?: string | undefined;
    enterpriseDiscount?: {
        amount: number;
        percentage: number;
        type: 'bulk' | 'seasonal' | 'loyalty' | 'market';
        validUntil?: Date;
    } | undefined;
    formattedWithTax?: string | undefined;
    priceHistory?: Array<{
        date: string;
        price: number;
        change: number;
    }> | undefined;
}

export interface EnterpriseLocation {
    address: string;
    geocoded?: {
        latitude: number;
        longitude: number;
        accuracy: number;
        timezone: string;
    } | undefined;
    nearby?: {
        schools: Array<{ name: string; distance: number; rating: number }>;
        hospitals: Array<{ name: string; distance: number; type: string }>;
        transport: Array<{ name: string; distance: number; type: string }>;
        amenities: Array<{ name: string; distance: number; category: string }>;
    } | undefined;
    travelTime?: {
        toCBD: number;
        toAirport: number;
        toMajorRoads: number;
    } | undefined;
    marketData?: {
        averagePrice: number;
        pricePerSqft: number;
        appreciation: number;
        liquidity: 'high' | 'medium' | 'low';
    } | undefined;
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
        factors: {
            location: number;
            market: number;
            property: number;
            economic: number;
        };
        recommendation: 'buy' | 'hold' | 'avoid';
    };
    investmentMetrics?: {
        roi: number;
        paybackPeriod: number;
        cashFlow: number;
        appreciation: number;
    } | undefined;
}

export interface UsePropertyFormattingReturn {
    formattedPrice: FormattedPrice;
    locationString: string;
    displayTitle: string;
    displayDescription: string;
    // Enterprise features
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

// Enterprise helper functions
const getRegionalLocale = (): string => {
    const userLocale = navigator.language || 'en-KE';
    const supportedLocales = ['en-KE', 'sw-KE', 'en-US', 'en-GB'];
    return supportedLocales.includes(userLocale) ? userLocale : 'en-KE';
};

const calculateEnterpriseDiscount = (
    originalPrice: number,
    currentPrice: number,
    category?: string
): FormattedPrice['enterpriseDiscount'] => {
    if (!originalPrice || originalPrice <= currentPrice) return undefined;

    const amount = originalPrice - currentPrice;
    const percentage = Math.round((amount / originalPrice) * 100);

    // Determine discount type based on percentage and category
    let type: 'bulk' | 'seasonal' | 'loyalty' | 'market' = 'market';
    if (percentage > 20) type = 'bulk';
    else if (percentage > 10) type = 'seasonal';
    else if (percentage > 5) type = 'loyalty';

    return {
        amount,
        percentage,
        type,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
};

const includeTaxCalculation = (price: number): string => {
    const taxRate = 0.16; // 16% VAT in Kenya
    const priceWithTax = price * (1 + taxRate);

    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0,
    }).format(priceWithTax);
};

const calculateTravelTime = (location: string): EnterpriseLocation['travelTime'] => {
    // Mock travel time calculation - in production, use Google Maps API
    const locationLower = location.toLowerCase();

    let toCBD = 45; // Default 45 minutes
    let toAirport = 60; // Default 60 minutes
    let toMajorRoads = 15; // Default 15 minutes

    // Adjust based on known locations
    if (locationLower.includes('westlands') || locationLower.includes('kilimani')) {
        toCBD = 20;
        toAirport = 45;
        toMajorRoads = 5;
    } else if (locationLower.includes('karen') || locationLower.includes('langata')) {
        toCBD = 35;
        toAirport = 30;
        toMajorRoads = 10;
    } else if (locationLower.includes('kiambu') || locationLower.includes('thika')) {
        toCBD = 60;
        toAirport = 90;
        toMajorRoads = 20;
    }

    return { toCBD, toAirport, toMajorRoads };
};

/**
 * Enhanced shared hook for formatting property data with enterprise features
 * Used by PropertyCard, EnhancedLandCard, and enterprise property components
 */
export function usePropertyFormatting(
    property: ExtendedProperty,
    options?: {
        originalPrice?: number;
        showUSDConversion?: boolean;
        exchangeRate?: number;
        enableEnterpriseFeatures?: boolean;
        userIncome?: number;
    }
): UsePropertyFormattingReturn {
    const {
        originalPrice,
        showUSDConversion = true,
        exchangeRate = 130,
        enableEnterpriseFeatures = true,
        userIncome
    } = options || {};

    // Enterprise real-time exchange rates
    const { data: exchangeRates } = useSafeQuery<ExchangeRatesResponse>({
        endpoint: '/api/exchange-rates',
        method: 'GET',
        fallbackData: { KESUSDT: exchangeRate, KESGBP: 165, KESEUR: 140 },
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: enableEnterpriseFeatures,
        context: 'exchange-rates',
    });

    // Enterprise geocoding data
    const { data: geocodingData } = useSafeQuery<GeocodingResponse | null>({
        endpoint: `/api/geocoding?address=${encodeURIComponent(property.location?.toString() || '')}`,
        method: 'GET',
        fallbackData: null,
        staleTime: 60 * 60 * 1000, // 1 hour
        enabled: enableEnterpriseFeatures && Boolean(property.location),
        context: 'geocoding',
    });

    // Enterprise market analysis
    const { data: marketData } = useSafeQuery<MarketAnalysisResponse | null>({
        endpoint: `/api/market-analysis?propertyId=${property.id}`,
        method: 'GET',
        fallbackData: null,
        staleTime: 30 * 60 * 1000, // 30 minutes
        enabled: enableEnterpriseFeatures && Boolean(property.id),
        context: 'market-analysis',
    });

    // Enhanced price formatting with enterprise features
    const formattedPrice = useMemo((): FormattedPrice => {
        const numericPrice = typeof property.price === "string" ? parseFloat(property.price) : property.price;

        if (!numericPrice || isNaN(numericPrice)) {
            return {
                primary: "Price on request",
                secondary: undefined,
                hasDiscount: false,
                discountPercentage: 0,
                originalPrice: undefined,
            };
        }

        // Use real-time exchange rate if available
        const realTimeRate = exchangeRates?.KESUSDT || exchangeRate;

        const kenyanPrice = new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
        }).format(numericPrice);

        // Regional formatting
        const regionalLocale = getRegionalLocale();
        const regionalPrice = new Intl.NumberFormat(regionalLocale, {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(numericPrice);

        let secondary: string | undefined;
        if (showUSDConversion) {
            const usdPrice = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
            }).format(Math.round(numericPrice / realTimeRate));
            secondary = `~${usdPrice}`;
        }

        const hasDiscount = Boolean(originalPrice && originalPrice > numericPrice);
        const discountPercentage = hasDiscount && originalPrice
            ? Math.round(((originalPrice - numericPrice) / originalPrice) * 100)
            : 0;

        // Enterprise discount calculation
        const enterpriseDiscount = enableEnterpriseFeatures
            ? calculateEnterpriseDiscount(originalPrice || 0, numericPrice, property.category)
            : undefined;

        // Price with tax calculation
        const formattedWithTax = enableEnterpriseFeatures
            ? includeTaxCalculation(numericPrice)
            : undefined;

        // Mock price history (in production, fetch from API)
        const priceHistory = enableEnterpriseFeatures ? [
            { date: '2024-01', price: numericPrice * 0.95, change: -5 },
            { date: '2024-02', price: numericPrice * 0.98, change: 3 },
            { date: '2024-03', price: numericPrice, change: 2 },
        ] : undefined;

        const result: FormattedPrice = {
            primary: kenyanPrice,
            secondary,
            hasDiscount,
            discountPercentage,
            originalPrice,
            regional: regionalPrice,
            enterpriseDiscount,
            formattedWithTax,
            priceHistory,
        };

        return result;
    }, [property.price, property.category, originalPrice, showUSDConversion, exchangeRate, exchangeRates, enableEnterpriseFeatures]);

    // Extract location string from various formats
    const locationString = useMemo(() => {
        if (typeof property.location === "string") {
            return property.location;
        }
        if (property.location && typeof property.location === "object" && "address" in property.location) {
            const locationObj = property.location as { address?: string };
            return locationObj.address || "Location not specified";
        }
        return "Location not specified";
    }, [property.location]);

    // Enterprise location intelligence
    const enterpriseLocation = useMemo((): EnterpriseLocation => {
        const baseLocation: EnterpriseLocation = {
            address: locationString,
        };

        if (!enableEnterpriseFeatures) return baseLocation;

        // Add geocoding data if available
        if (geocodingData) {
            baseLocation.geocoded = {
                latitude: geocodingData.lat || 0,
                longitude: geocodingData.lng || 0,
                accuracy: geocodingData.accuracy || 0,
                timezone: geocodingData.timezone || 'Africa/Nairobi',
            };
        }

        // Mock nearby amenities (in production, use Google Places API)
        baseLocation.nearby = {
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

        // Calculate travel times
        baseLocation.travelTime = calculateTravelTime(locationString);

        // Add market data if available
        if (marketData?.location) {
            baseLocation.marketData = {
                averagePrice: marketData.location.averagePrice || 0,
                pricePerSqft: marketData.location.pricePerSqft || 0,
                appreciation: marketData.location.appreciation || 0,
                liquidity: marketData.location.liquidity || 'medium',
            };
        }

        return baseLocation;
    }, [locationString, enableEnterpriseFeatures, geocodingData, marketData]);

    // Clean and format title
    const displayTitle = useMemo(() => {
        return property.title?.trim() || "Untitled Property";
    }, [property.title]);

    // Clean and format description
    const displayDescription = useMemo(() => {
        return property.description?.trim() || "";
    }, [property.description]);

    // Enterprise insights and analytics
    const enterpriseInsights = useMemo((): EnterpriseInsights => {
        if (!enableEnterpriseFeatures) {
            return {
                priceTrend: { direction: 'stable', percentage: 0, period: '3M', confidence: 0 },
                marketAnalysis: { competitiveness: 0, demandLevel: 'medium', supplyLevel: 'medium', marketScore: 0, comparables: 0 },
                riskScore: { overall: 0, factors: { location: 0, market: 0, property: 0, economic: 0 }, recommendation: 'hold' },
            };
        }

        // Price trend analysis
        const priceTrend = {
            direction: (marketData?.priceTrend?.direction || 'stable') as 'up' | 'down' | 'stable',
            percentage: marketData?.priceTrend?.percentage || 0,
            period: marketData?.priceTrend?.period || '3M',
            confidence: marketData?.priceTrend?.confidence || 75,
        };

        // Market analysis
        const marketAnalysis = {
            competitiveness: marketData?.market?.competitiveness || 75,
            demandLevel: (marketData?.market?.demandLevel || 'medium') as 'high' | 'medium' | 'low',
            supplyLevel: (marketData?.market?.supplyLevel || 'medium') as 'high' | 'medium' | 'low',
            marketScore: marketData?.market?.score || 80,
            comparables: marketData?.market?.comparables || 15,
        };

        // Risk assessment
        const locationRisk = enterpriseLocation.travelTime ?
            Math.max(0, 100 - (enterpriseLocation.travelTime.toCBD * 2)) : 70;
        const marketRisk = marketAnalysis.marketScore;
        const propertyRisk = property.condition === 'excellent' ? 90 :
            property.condition === 'good' ? 75 : 60;
        const economicRisk = 75; // Mock economic indicator

        const overallRisk = Math.round((locationRisk + marketRisk + propertyRisk + economicRisk) / 4);

        const riskScore = {
            overall: overallRisk,
            factors: {
                location: locationRisk,
                market: marketRisk,
                property: propertyRisk,
                economic: economicRisk,
            },
            recommendation: (overallRisk > 80 ? 'buy' : overallRisk > 60 ? 'hold' : 'avoid') as 'buy' | 'hold' | 'avoid',
        };

        // Investment metrics
        const numericPrice = typeof property.price === "string" ? parseFloat(property.price) : property.price;
        const investmentMetrics: EnterpriseInsights['investmentMetrics'] = numericPrice ? {
            roi: marketData?.investment?.roi || 8.5,
            paybackPeriod: marketData?.investment?.paybackPeriod || 12,
            cashFlow: marketData?.investment?.cashFlow || numericPrice * 0.05,
            appreciation: marketData?.investment?.appreciation || 6.2,
        } : undefined;

        return {
            priceTrend,
            marketAnalysis,
            riskScore,
            investmentMetrics,
        };
    }, [enableEnterpriseFeatures, marketData, property, enterpriseLocation]);

    // Format price for different regions
    const formatPriceForRegion = useCallback((region: string) => {
        const numericPrice = typeof property.price === "string" ? parseFloat(property.price) : property.price;
        if (!numericPrice) return "Price on request";

        const regionLocales: Record<string, { locale: string; currency: string; rate: number }> = {
            'kenya': { locale: 'en-KE', currency: 'KES', rate: 1 },
            'usa': { locale: 'en-US', currency: 'USD', rate: exchangeRates?.KESUSDT || exchangeRate },
            'uk': { locale: 'en-GB', currency: 'GBP', rate: exchangeRates?.KESGBP || 165 },
            'europe': { locale: 'en-EU', currency: 'EUR', rate: exchangeRates?.KESEUR || 140 },
        };

        const regionConfig = regionLocales[region.toLowerCase()];
        if (!regionConfig) {
            // Fallback to Kenya if region not found
            const kenyaConfig = regionLocales['kenya'];
            if (!kenyaConfig) {
                return "Price on request"; // Ultimate fallback
            }
            return new Intl.NumberFormat(kenyaConfig.locale, {
                style: "currency",
                currency: kenyaConfig.currency,
                minimumFractionDigits: 0,
            }).format(numericPrice);
        }

        const convertedPrice = numericPrice / regionConfig.rate;

        return new Intl.NumberFormat(regionConfig.locale, {
            style: "currency",
            currency: regionConfig.currency,
            minimumFractionDigits: 0,
        }).format(convertedPrice);
    }, [property.price, exchangeRates, exchangeRate]);

    // Calculate affordability based on user income
    const calculateAffordability = useCallback((income: number) => {
        const numericPrice = typeof property.price === "string" ? parseFloat(property.price) : property.price;
        if (!numericPrice || !income) {
            return {
                affordable: false,
                monthlyPayment: 0,
                downPayment: 0,
                loanAmount: 0,
            };
        }

        const downPaymentPercentage = 0.20; // 20% down payment
        const interestRate = 0.12; // 12% annual interest rate
        const loanTermYears = 25; // 25-year mortgage

        const downPayment = numericPrice * downPaymentPercentage;
        const loanAmount = numericPrice - downPayment;

        // Calculate monthly payment using mortgage formula
        const monthlyRate = interestRate / 12;
        const numberOfPayments = loanTermYears * 12;
        const monthlyPayment = loanAmount *
            (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

        // Rule of thumb: housing should not exceed 30% of income
        const maxAffordablePayment = (income * 0.30) / 12;
        const affordable = monthlyPayment <= maxAffordablePayment;

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