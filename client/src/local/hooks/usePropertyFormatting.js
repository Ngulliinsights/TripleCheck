"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePropertyFormatting = usePropertyFormatting;
var react_1 = require("react");
var useSafeQuery_1 = require("./useSafeQuery");
// Enterprise helper functions
var getRegionalLocale = function () {
    var userLocale = navigator.language || 'en-KE';
    var supportedLocales = ['en-KE', 'sw-KE', 'en-US', 'en-GB'];
    return supportedLocales.includes(userLocale) ? userLocale : 'en-KE';
};
var calculateEnterpriseDiscount = function (originalPrice, currentPrice, category) {
    if (!originalPrice || originalPrice <= currentPrice)
        return undefined;
    var amount = originalPrice - currentPrice;
    var percentage = Math.round((amount / originalPrice) * 100);
    // Determine discount type based on percentage and category
    var type = 'market';
    if (percentage > 20)
        type = 'bulk';
    else if (percentage > 10)
        type = 'seasonal';
    else if (percentage > 5)
        type = 'loyalty';
    return {
        amount: amount,
        percentage: percentage,
        type: type,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
};
var includeTaxCalculation = function (price) {
    var taxRate = 0.16; // 16% VAT in Kenya
    var priceWithTax = price * (1 + taxRate);
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0,
    }).format(priceWithTax);
};
var calculateTravelTime = function (location) {
    // Mock travel time calculation - in production, use Google Maps API
    var locationLower = location.toLowerCase();
    var toCBD = 45; // Default 45 minutes
    var toAirport = 60; // Default 60 minutes
    var toMajorRoads = 15; // Default 15 minutes
    // Adjust based on known locations
    if (locationLower.includes('westlands') || locationLower.includes('kilimani')) {
        toCBD = 20;
        toAirport = 45;
        toMajorRoads = 5;
    }
    else if (locationLower.includes('karen') || locationLower.includes('langata')) {
        toCBD = 35;
        toAirport = 30;
        toMajorRoads = 10;
    }
    else if (locationLower.includes('kiambu') || locationLower.includes('thika')) {
        toCBD = 60;
        toAirport = 90;
        toMajorRoads = 20;
    }
    return { toCBD: toCBD, toAirport: toAirport, toMajorRoads: toMajorRoads };
};
/**
 * Enhanced shared hook for formatting property data with enterprise features
 * Used by PropertyCard, EnhancedLandCard, and enterprise property components
 */
function usePropertyFormatting(property, options) {
    var _a;
    var _b = options || {}, originalPrice = _b.originalPrice, _c = _b.showUSDConversion, showUSDConversion = _c === void 0 ? true : _c, _d = _b.exchangeRate, exchangeRate = _d === void 0 ? 130 : _d, _e = _b.enableEnterpriseFeatures, enableEnterpriseFeatures = _e === void 0 ? true : _e, userIncome = _b.userIncome;
    // Enterprise real-time exchange rates
    var exchangeRates = (0, useSafeQuery_1.useSafeQuery)({
        endpoint: '/api/exchange-rates',
        method: 'GET',
        fallbackData: { KESUSDT: exchangeRate, KESGBP: 165, KESEUR: 140 },
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: enableEnterpriseFeatures,
        context: 'exchange-rates',
    }).data;
    // Enterprise geocoding data
    var geocodingData = (0, useSafeQuery_1.useSafeQuery)({
        endpoint: "/api/geocoding?address=".concat(encodeURIComponent(((_a = property.location) === null || _a === void 0 ? void 0 : _a.toString()) || '')),
        method: 'GET',
        fallbackData: null,
        staleTime: 60 * 60 * 1000, // 1 hour
        enabled: enableEnterpriseFeatures && Boolean(property.location),
        context: 'geocoding',
    }).data;
    // Enterprise market analysis
    var marketData = (0, useSafeQuery_1.useSafeQuery)({
        endpoint: "/api/market-analysis?propertyId=".concat(property.id),
        method: 'GET',
        fallbackData: null,
        staleTime: 30 * 60 * 1000, // 30 minutes
        enabled: enableEnterpriseFeatures && Boolean(property.id),
        context: 'market-analysis',
    }).data;
    // Enhanced price formatting with enterprise features
    var formattedPrice = (0, react_1.useMemo)(function () {
        var numericPrice = typeof property.price === "string" ? parseFloat(property.price) : property.price;
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
        var realTimeRate = (exchangeRates === null || exchangeRates === void 0 ? void 0 : exchangeRates.KESUSDT) || exchangeRate;
        var kenyanPrice = new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
        }).format(numericPrice);
        // Regional formatting
        var regionalLocale = getRegionalLocale();
        var regionalPrice = new Intl.NumberFormat(regionalLocale, {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(numericPrice);
        var secondary;
        if (showUSDConversion) {
            var usdPrice = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
            }).format(Math.round(numericPrice / realTimeRate));
            secondary = "~".concat(usdPrice);
        }
        var hasDiscount = Boolean(originalPrice && originalPrice > numericPrice);
        var discountPercentage = hasDiscount && originalPrice
            ? Math.round(((originalPrice - numericPrice) / originalPrice) * 100)
            : 0;
        // Enterprise discount calculation
        var enterpriseDiscount = enableEnterpriseFeatures
            ? calculateEnterpriseDiscount(originalPrice || 0, numericPrice, property.category)
            : undefined;
        // Price with tax calculation
        var formattedWithTax = enableEnterpriseFeatures
            ? includeTaxCalculation(numericPrice)
            : undefined;
        // Mock price history (in production, fetch from API)
        var priceHistory = enableEnterpriseFeatures ? [
            { date: '2024-01', price: numericPrice * 0.95, change: -5 },
            { date: '2024-02', price: numericPrice * 0.98, change: 3 },
            { date: '2024-03', price: numericPrice, change: 2 },
        ] : undefined;
        var result = {
            primary: kenyanPrice,
            secondary: secondary,
            hasDiscount: hasDiscount,
            discountPercentage: discountPercentage,
            originalPrice: originalPrice,
            regional: regionalPrice,
            enterpriseDiscount: enterpriseDiscount,
            formattedWithTax: formattedWithTax,
            priceHistory: priceHistory,
        };
        return result;
    }, [property.price, property.category, originalPrice, showUSDConversion, exchangeRate, exchangeRates, enableEnterpriseFeatures]);
    // Extract location string from various formats
    var locationString = (0, react_1.useMemo)(function () {
        if (typeof property.location === "string") {
            return property.location;
        }
        if (property.location && typeof property.location === "object" && "address" in property.location) {
            var locationObj = property.location;
            return locationObj.address || "Location not specified";
        }
        return "Location not specified";
    }, [property.location]);
    // Enterprise location intelligence
    var enterpriseLocation = (0, react_1.useMemo)(function () {
        var baseLocation = {
            address: locationString,
        };
        if (!enableEnterpriseFeatures)
            return baseLocation;
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
        if (marketData === null || marketData === void 0 ? void 0 : marketData.location) {
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
    var displayTitle = (0, react_1.useMemo)(function () {
        var _a;
        return ((_a = property.title) === null || _a === void 0 ? void 0 : _a.trim()) || "Untitled Property";
    }, [property.title]);
    // Clean and format description
    var displayDescription = (0, react_1.useMemo)(function () {
        var _a;
        return ((_a = property.description) === null || _a === void 0 ? void 0 : _a.trim()) || "";
    }, [property.description]);
    // Enterprise insights and analytics
    var enterpriseInsights = (0, react_1.useMemo)(function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        if (!enableEnterpriseFeatures) {
            return {
                priceTrend: { direction: 'stable', percentage: 0, period: '3M', confidence: 0 },
                marketAnalysis: { competitiveness: 0, demandLevel: 'medium', supplyLevel: 'medium', marketScore: 0, comparables: 0 },
                riskScore: { overall: 0, factors: { location: 0, market: 0, property: 0, economic: 0 }, recommendation: 'hold' },
            };
        }
        // Price trend analysis
        var priceTrend = {
            direction: (((_a = marketData === null || marketData === void 0 ? void 0 : marketData.priceTrend) === null || _a === void 0 ? void 0 : _a.direction) || 'stable'),
            percentage: ((_b = marketData === null || marketData === void 0 ? void 0 : marketData.priceTrend) === null || _b === void 0 ? void 0 : _b.percentage) || 0,
            period: ((_c = marketData === null || marketData === void 0 ? void 0 : marketData.priceTrend) === null || _c === void 0 ? void 0 : _c.period) || '3M',
            confidence: ((_d = marketData === null || marketData === void 0 ? void 0 : marketData.priceTrend) === null || _d === void 0 ? void 0 : _d.confidence) || 75,
        };
        // Market analysis
        var marketAnalysis = {
            competitiveness: ((_e = marketData === null || marketData === void 0 ? void 0 : marketData.market) === null || _e === void 0 ? void 0 : _e.competitiveness) || 75,
            demandLevel: (((_f = marketData === null || marketData === void 0 ? void 0 : marketData.market) === null || _f === void 0 ? void 0 : _f.demandLevel) || 'medium'),
            supplyLevel: (((_g = marketData === null || marketData === void 0 ? void 0 : marketData.market) === null || _g === void 0 ? void 0 : _g.supplyLevel) || 'medium'),
            marketScore: ((_h = marketData === null || marketData === void 0 ? void 0 : marketData.market) === null || _h === void 0 ? void 0 : _h.score) || 80,
            comparables: ((_j = marketData === null || marketData === void 0 ? void 0 : marketData.market) === null || _j === void 0 ? void 0 : _j.comparables) || 15,
        };
        // Risk assessment
        var locationRisk = enterpriseLocation.travelTime ?
            Math.max(0, 100 - (enterpriseLocation.travelTime.toCBD * 2)) : 70;
        var marketRisk = marketAnalysis.marketScore;
        var propertyRisk = property.condition === 'excellent' ? 90 :
            property.condition === 'good' ? 75 : 60;
        var economicRisk = 75; // Mock economic indicator
        var overallRisk = Math.round((locationRisk + marketRisk + propertyRisk + economicRisk) / 4);
        var riskScore = {
            overall: overallRisk,
            factors: {
                location: locationRisk,
                market: marketRisk,
                property: propertyRisk,
                economic: economicRisk,
            },
            recommendation: (overallRisk > 80 ? 'buy' : overallRisk > 60 ? 'hold' : 'avoid'),
        };
        // Investment metrics
        var numericPrice = typeof property.price === "string" ? parseFloat(property.price) : property.price;
        var investmentMetrics = numericPrice ? {
            roi: ((_k = marketData === null || marketData === void 0 ? void 0 : marketData.investment) === null || _k === void 0 ? void 0 : _k.roi) || 8.5,
            paybackPeriod: ((_l = marketData === null || marketData === void 0 ? void 0 : marketData.investment) === null || _l === void 0 ? void 0 : _l.paybackPeriod) || 12,
            cashFlow: ((_m = marketData === null || marketData === void 0 ? void 0 : marketData.investment) === null || _m === void 0 ? void 0 : _m.cashFlow) || numericPrice * 0.05,
            appreciation: ((_o = marketData === null || marketData === void 0 ? void 0 : marketData.investment) === null || _o === void 0 ? void 0 : _o.appreciation) || 6.2,
        } : undefined;
        return {
            priceTrend: priceTrend,
            marketAnalysis: marketAnalysis,
            riskScore: riskScore,
            investmentMetrics: investmentMetrics,
        };
    }, [enableEnterpriseFeatures, marketData, property, enterpriseLocation]);
    // Format price for different regions
    var formatPriceForRegion = (0, react_1.useCallback)(function (region) {
        var numericPrice = typeof property.price === "string" ? parseFloat(property.price) : property.price;
        if (!numericPrice)
            return "Price on request";
        var regionLocales = {
            'kenya': { locale: 'en-KE', currency: 'KES', rate: 1 },
            'usa': { locale: 'en-US', currency: 'USD', rate: (exchangeRates === null || exchangeRates === void 0 ? void 0 : exchangeRates.KESUSDT) || exchangeRate },
            'uk': { locale: 'en-GB', currency: 'GBP', rate: (exchangeRates === null || exchangeRates === void 0 ? void 0 : exchangeRates.KESGBP) || 165 },
            'europe': { locale: 'en-EU', currency: 'EUR', rate: (exchangeRates === null || exchangeRates === void 0 ? void 0 : exchangeRates.KESEUR) || 140 },
        };
        var regionConfig = regionLocales[region.toLowerCase()];
        if (!regionConfig) {
            // Fallback to Kenya if region not found
            var kenyaConfig = regionLocales['kenya'];
            if (!kenyaConfig) {
                return "Price on request"; // Ultimate fallback
            }
            return new Intl.NumberFormat(kenyaConfig.locale, {
                style: "currency",
                currency: kenyaConfig.currency,
                minimumFractionDigits: 0,
            }).format(numericPrice);
        }
        var convertedPrice = numericPrice / regionConfig.rate;
        return new Intl.NumberFormat(regionConfig.locale, {
            style: "currency",
            currency: regionConfig.currency,
            minimumFractionDigits: 0,
        }).format(convertedPrice);
    }, [property.price, exchangeRates, exchangeRate]);
    // Calculate affordability based on user income
    var calculateAffordability = (0, react_1.useCallback)(function (income) {
        var numericPrice = typeof property.price === "string" ? parseFloat(property.price) : property.price;
        if (!numericPrice || !income) {
            return {
                affordable: false,
                monthlyPayment: 0,
                downPayment: 0,
                loanAmount: 0,
            };
        }
        var downPaymentPercentage = 0.20; // 20% down payment
        var interestRate = 0.12; // 12% annual interest rate
        var loanTermYears = 25; // 25-year mortgage
        var downPayment = numericPrice * downPaymentPercentage;
        var loanAmount = numericPrice - downPayment;
        // Calculate monthly payment using mortgage formula
        var monthlyRate = interestRate / 12;
        var numberOfPayments = loanTermYears * 12;
        var monthlyPayment = loanAmount *
            (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
        // Rule of thumb: housing should not exceed 30% of income
        var maxAffordablePayment = (income * 0.30) / 12;
        var affordable = monthlyPayment <= maxAffordablePayment;
        return {
            affordable: affordable,
            monthlyPayment: Math.round(monthlyPayment),
            downPayment: Math.round(downPayment),
            loanAmount: Math.round(loanAmount),
        };
    }, [property.price]);
    return {
        formattedPrice: formattedPrice,
        locationString: locationString,
        displayTitle: displayTitle,
        displayDescription: displayDescription,
        enterpriseLocation: enterpriseLocation,
        enterpriseInsights: enterpriseInsights,
        formatPriceForRegion: formatPriceForRegion,
        calculateAffordability: calculateAffordability,
    };
}
exports.default = usePropertyFormatting;
