import { Alert, AlertDescription } from '../../shared/components/ui/alert'
import { Badge } from '../../shared/components/ui/badge'
import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Label } from '../../shared/components/ui/label'
import { Progress } from '../../shared/components/ui/progress'
import { Slider } from '../../shared/components/ui/slider'
import { cn } from '../../shared/lib/utils'
import { 
  Settings, 
  RotateCcw, 
  Save,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import type { RiskCategory } from '@/types/land-verification'

interface RiskWeightingControlsProps {
  currentWeights: Record<string, number>;
  onWeightsChange: (weights: Record<string, number>) => void;
  onResetWeights: () => void;
  className?: string;
}

interface WeightConfig {
  category: RiskCategory;
  weight: number;
  label: string;
  description: string;
  color: string;
  recommendedRange: [number, number];
}

const DEFAULT_WEIGHT_CONFIGS: WeightConfig[] = [
  {
    category: 'ownership',
    weight: 0.3,
    label: 'Ownership Verification',
    description: 'Title deeds, ownership history, and transfer legitimacy',
    color: '#3b82f6',
    recommendedRange: [0.25, 0.35]
  },
  {
    category: 'government',
    weight: 0.25,
    label: 'Government Designations',
    description: 'Government claims, planned developments, and regulatory restrictions',
    color: '#8b5cf6',
    recommendedRange: [0.2, 0.3]
  },
  {
    category: 'legal',
    weight: 0.2,
    label: 'Legal History',
    description: 'Court cases, disputes, and legal complications',
    color: '#ef4444',
    recommendedRange: [0.15, 0.25]
  },
  {
    category: 'physical',
    weight: 0.15,
    label: 'Physical Verification',
    description: 'Ground-truthing, boundary verification, and physical features',
    color: '#10b981',
    recommendedRange: [0.1, 0.2]
  },
  {
    category: 'community',
    weight: 0.1,
    label: 'Community Intelligence',
    description: 'Local knowledge, community feedback, and social factors',
    color: '#f59e0b',
    recommendedRange: [0.05, 0.15]
  }
];

export default function RiskWeightingControls({
  currentWeights,
  onWeightsChange,
  onResetWeights,
  className
}: RiskWeightingControlsProps) {
  const [localWeights, setLocalWeights] = useState<Record<string, number>>(currentWeights);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setLocalWeights(currentWeights);
    setHasUnsavedChanges(false);
  }, [currentWeights]);

  const totalWeight = Object.values(localWeights).reduce((sum, weight) => sum + weight, 0);
  const isValidWeightDistribution = Math.abs(totalWeight - 1.0) < 0.01;

  const handleWeightChange = (category: RiskCategory, newWeight: number) => {
    const updatedWeights = {
      ...localWeights,
      [category]: newWeight / 100 // Convert percentage to decimal
    };
    setLocalWeights(updatedWeights);
    setHasUnsavedChanges(true);
  };

  const handleSaveWeights = () => {
    if (isValidWeightDistribution) {
      onWeightsChange(localWeights);
      setHasUnsavedChanges(false);
    }
  };

  const handleResetWeights = () => {
    onResetWeights();
    setHasUnsavedChanges(false);
  };

  const normalizeWeights = () => {
    const total = Object.values(localWeights).reduce((sum, weight) => sum + weight, 0);
    if (total === 0) return;

    const normalizedWeights = Object.keys(localWeights).reduce((acc, key) => {
      acc[key] = localWeights[key] / total;
      return acc;
    }, {} as Record<string, number>);

    setLocalWeights(normalizedWeights);
    setHasUnsavedChanges(true);
  };

  const getWeightStatus = (category: RiskCategory, weight: number): 'optimal' | 'high' | 'low' => {
    const config = DEFAULT_WEIGHT_CONFIGS.find(c => c.category === category);
    if (!config) return 'optimal';

    const [min, max] = config.recommendedRange;
    if (weight < min) return 'low';
    if (weight > max) return 'high';
    return 'optimal';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const WeightSlider = ({ config }: { config: WeightConfig }) => {
    const currentWeight = localWeights[config.category] || 0;
    const weightPercentage = currentWeight * 100;
    const status = getWeightStatus(config.category, currentWeight);
    const [minRec, maxRec] = config.recommendedRange;

    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <h4 className="font-medium text-sm">{config.label}</h4>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn('text-xs', getStatusColor(status))}>
                  {status}
                </Badge>
                <span className="text-sm font-medium">{weightPercentage.toFixed(1)}%</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{config.description}</p>

            <div className="space-y-2">
              <Slider
                value={[weightPercentage]}
                onValueChange={([value]) => handleWeightChange(config.category, value)}
                max={50}
                min={0}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="text-center">
                  Recommended: {(minRec * 100).toFixed(0)}%-{(maxRec * 100).toFixed(0)}%
                </span>
                <span>50%</span>
              </div>
            </div>

            {/* Visual indicator for recommended range */}
            <div className="relative h-1 bg-gray-200 rounded">
              <div
                className="absolute h-1 bg-green-300 rounded"
                style={{
                  left: `${(minRec * 100) * 2}%`, // *2 because max is 50%
                  width: `${((maxRec - minRec) * 100) * 2}%`
                }}
              />
              <div
                className="absolute w-1 h-3 bg-blue-600 rounded -top-1"
                style={{ left: `${weightPercentage * 2}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Risk Weighting Controls
            </CardTitle>
            <CardDescription>
              Adjust the importance of different risk categories in the overall assessment
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleResetWeights}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={handleSaveWeights}
              disabled={!hasUnsavedChanges || !isValidWeightDistribution}
            >
              <Save className="h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>

        {/* Weight Distribution Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total Weight Distribution</span>
            <span className={cn(
              'text-sm font-bold',
              isValidWeightDistribution ? 'text-green-600' : 'text-red-600'
            )}>
              {(totalWeight * 100).toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={totalWeight * 100} 
            className={cn(
              'h-2',
              isValidWeightDistribution ? 'text-green-600' : 'text-red-600'
            )}
          />
          {!isValidWeightDistribution && (
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-orange-600">
                Weights should total 100%. Current: {(totalWeight * 100).toFixed(1)}%
              </span>
              <Button variant="outline" size="sm" onClick={normalizeWeights}>
                Auto-normalize
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Weight Controls */}
        <div className="space-y-3">
          {DEFAULT_WEIGHT_CONFIGS.map(config => (
            <WeightSlider key={config.category} config={config} />
          ))}
        </div>

        {/* Impact Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Impact Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                These weight changes will affect how risk factors contribute to the overall risk score:
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium mb-2">Increased Influence:</div>
                  {DEFAULT_WEIGHT_CONFIGS
                    .filter(config => {
                      const currentWeight = localWeights[config.category] || 0;
                      return currentWeight > config.weight;
                    })
                    .map(config => (
                      <div key={config.category} className="flex items-center gap-2 text-xs">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="capitalize">{config.category}</span>
                        <span className="text-muted-foreground">
                          (+{((localWeights[config.category] - config.weight) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                </div>
                
                <div>
                  <div className="text-xs font-medium mb-2">Decreased Influence:</div>
                  {DEFAULT_WEIGHT_CONFIGS
                    .filter(config => {
                      const currentWeight = localWeights[config.category] || 0;
                      return currentWeight < config.weight;
                    })
                    .map(config => (
                      <div key={config.category} className="flex items-center gap-2 text-xs">
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        <span className="capitalize">{config.category}</span>
                        <span className="text-muted-foreground">
                          ({((localWeights[config.category] - config.weight) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Weighting Guidelines:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Ownership verification typically has the highest weight (25-35%)</li>
              <li>• Government designations are critical for long-term security (20-30%)</li>
              <li>• Legal history weight depends on dispute prevalence in the area (15-25%)</li>
              <li>• Physical verification provides ground-truth validation (10-20%)</li>
              <li>• Community intelligence offers local context (5-15%)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {hasUnsavedChanges && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes to the risk weights. Click "Apply" to update the risk assessment.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}