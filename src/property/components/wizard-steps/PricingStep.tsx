import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Info,
  Target,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';

import { PropertyFormData } from '../PropertyListingWizard';

interface PricingStepProps {
  data: PropertyFormData;
  onUpdate: (updates: Partial<PropertyFormData>) => void;
  onValidation: (isValid: boolean) => void;
}

interface MarketInsight {
  averagePrice: number;
  priceRange: { min: number; max: number };
  pricePerSqFt: number;
  marketTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  comparableProperties: number;
  recommendedPrice: number;
  confidence: 'high' | 'medium' | 'low';
}

const CURRENCIES = [
  { value: 'KES', label: 'KES (Kenyan Shilling)', symbol: 'KSh' },
  { value: 'USD', label: 'USD (US Dollar)', symbol: '$' },
  { value: 'EUR', label: 'EUR (Euro)', symbol: '€' }
];

export function PricingStep({ data, onUpdate, onValidation }: PricingStepProps) {
  const [marketInsights, setMarketInsights] = useState<MarketInsight | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [priceInput, setPriceInput] = useState(data.price.toString());

  // Validate step
  useEffect(() => {
    const isValid = data.price > 0;
    onValidation(isValid);
  }, [data.price, onValidation]);

  // Update price when input changes
  useEffect(() => {
    const numPrice = parseFloat(priceInput) || 0;
    if (numPrice !== data.price) {
      onUpdate({ price: numPrice });
    }
  }, [priceInput, data.price, onUpdate]);

  // Load market insights
  const loadMarketInsights = useCallback(async () => {
    if (!data.location.city || !data.propertyType || !data.area) {
      return;
    }

    setLoadingInsights(true);
    
    try {
      // Simulate API call for market insights
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock market data based on property details
      const basePrice = data.propertyType === 'apartment' ? 8000000 : 
                       data.propertyType === 'house' ? 12000000 :
                       data.propertyType === 'condo' ? 10000000 :
                       data.propertyType === 'townhouse' ? 9000000 : 5000000;
      
      const areaMultiplier = data.area / 1000;
      const locationMultiplier = data.location.city.toLowerCase().includes('nairobi') ? 1.5 : 1.0;
      
      const estimatedPrice = basePrice * areaMultiplier * locationMultiplier;
      
      const mockInsights: MarketInsight = {
        averagePrice: estimatedPrice,
        priceRange: {
          min: estimatedPrice * 0.8,
          max: estimatedPrice * 1.2
        },
        pricePerSqFt: estimatedPrice / data.area,
        marketTrend: Math.random() > 0.5 ? 'up' : 'down',
        trendPercentage: Math.random() * 10 + 2,
        comparableProperties: Math.floor(Math.random() * 20) + 5,
        recommendedPrice: estimatedPrice * (0.95 + Math.random() * 0.1),
        confidence: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
      };
      
      setMarketInsights(mockInsights);
    } catch (error) {
      console.error('Failed to load market insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  }, [data.location.city, data.propertyType, data.area]);

  // Load insights when component mounts or key data changes
  useEffect(() => {
    loadMarketInsights();
  }, [loadMarketInsights]);

  const handlePriceChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    setPriceInput(cleanValue);
  };

  const handleCurrencyChange = (currency: string) => {
    onUpdate({ currency });
  };

  const handlePriceTypeChange = (priceType: 'sale' | 'rent') => {
    onUpdate({ priceType });
  };

  const useRecommendedPrice = () => {
    if (marketInsights) {
      const recommendedPrice = marketInsights.recommendedPrice.toString();
      setPriceInput(recommendedPrice);
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = CURRENCIES.find(c => c.value === data.currency);
    const symbol = currency?.symbol || 'KSh';
    return `${symbol} ${amount.toLocaleString()}`;
  };

  const getPriceAnalysis = () => {
    if (!marketInsights || !data.price) return null;
    
    const userPrice = data.price;
    const {recommendedPrice} = marketInsights;
    const difference = ((userPrice - recommendedPrice) / recommendedPrice) * 100;
    
    if (Math.abs(difference) < 5) {
      return { status: 'good', message: 'Your price is well-aligned with market rates' };
    } else if (difference > 15) {
      return { status: 'high', message: 'Your price is significantly above market rates' };
    } else if (difference < -15) {
      return { status: 'low', message: 'Your price is significantly below market rates' };
    } else if (difference > 0) {
      return { status: 'slightly-high', message: 'Your price is slightly above market rates' };
    } else {
      return { status: 'slightly-low', message: 'Your price is slightly below market rates' };
    }
  };

  const priceAnalysis = getPriceAnalysis();

  return (
    <div className="space-y-6">
      {/* Price Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Property Price
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Type */}
          <div className="space-y-2">
            <Label>Listing Type *</Label>
            <Select value={data.priceType} onValueChange={handlePriceTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select listing type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Currency and Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Currency *</Label>
              <Select value={data.currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="price">
                Price * {data.priceType === 'rent' && '(per month)'}
              </Label>
              <div className="relative">
                <Input
                  id="price"
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0"
                  className="text-lg font-medium pl-12"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {CURRENCIES.find(c => c.value === data.currency)?.symbol || 'KSh'}
                </span>
              </div>
              {data.price > 0 && (
                <p className="text-sm text-gray-600">
                  {formatCurrency(data.price)} {data.priceType === 'rent' ? 'per month' : 'total'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Market Insights
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMarketInsights}
              disabled={loadingInsights}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              {loadingInsights ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingInsights ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ) : marketInsights ? (
            <div className="space-y-4">
              {/* Market Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Average Price</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(marketInsights.averagePrice)}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Price per Sq Ft</span>
                  </div>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(marketInsights.pricePerSqFt)}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {marketInsights.marketTrend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-purple-600" />
                    )}
                    <span className="text-sm font-medium text-purple-800">Market Trend</span>
                  </div>
                  <p className="text-lg font-bold text-purple-900">
                    {marketInsights.marketTrend === 'up' ? '+' : '-'}{marketInsights.trendPercentage.toFixed(1)}%
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Comparables</span>
                  </div>
                  <p className="text-lg font-bold text-orange-900">
                    {marketInsights.comparableProperties} properties
                  </p>
                </div>
              </div>

              {/* Price Range */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Market Price Range</h4>
                <div className="flex items-center justify-between text-sm">
                  <span>Low: {formatCurrency(marketInsights.priceRange.min)}</span>
                  <span>High: {formatCurrency(marketInsights.priceRange.max)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full w-3/5"></div>
                </div>
              </div>

              {/* Recommended Price */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Recommended Price</span>
                      <Badge variant={
                        marketInsights.confidence === 'high' ? 'default' :
                        marketInsights.confidence === 'medium' ? 'secondary' : 'outline'
                      }>
                        {marketInsights.confidence} confidence
                      </Badge>
                    </div>
                    <p className="text-xl font-bold text-yellow-900">
                      {formatCurrency(marketInsights.recommendedPrice)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={useRecommendedPrice}
                    className="flex items-center gap-2"
                  >
                    Use This Price
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Complete the location and property details to see market insights.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Price Analysis */}
      {priceAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={
              priceAnalysis.status === 'good' ? 'border-green-200 bg-green-50' :
              priceAnalysis.status === 'high' || priceAnalysis.status === 'slightly-high' ? 'border-red-200 bg-red-50' :
              'border-yellow-200 bg-yellow-50'
            }>
              <AlertDescription className={
                priceAnalysis.status === 'good' ? 'text-green-800' :
                priceAnalysis.status === 'high' || priceAnalysis.status === 'slightly-high' ? 'text-red-800' :
                'text-yellow-800'
              }>
                {priceAnalysis.message}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Pricing Tips */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">💰 Pricing Tips</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Research similar properties in your area for competitive pricing</li>
            <li>• Consider market trends and seasonal fluctuations</li>
            <li>• Price competitively to attract more potential buyers/tenants</li>
            <li>• Factor in unique features that add value to your property</li>
            <li>• Be prepared to negotiate - leave some room for bargaining</li>
            <li>• Review and adjust pricing based on market response</li>
          </ul>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Step Completion</h4>
              <p className="text-sm text-gray-600">
                Set a competitive price for your property
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={data.price > 0 ? 'default' : 'secondary'}>
                Price {data.price > 0 ? '✓' : '○'}
              </Badge>
              <Badge variant={data.currency ? 'default' : 'secondary'}>
                Currency {data.currency ? '✓' : '○'}
              </Badge>
              <Badge variant={data.priceType ? 'default' : 'secondary'}>
                Type {data.priceType ? '✓' : '○'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}