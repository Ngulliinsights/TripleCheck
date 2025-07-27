import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Slider } from '@shared/components/ui/slider';
import { Badge } from '@shared/components/ui/badge';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { Progress } from '@shared/components/ui/progress';
import { 
  Play, 
  RotateCcw, 
  Save, 
  Copy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Calculator,
  Target,
  Plus,
  Minus,
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { 
  RiskFactorWithContext,
  RiskLevel,
  RiskCategory,
  Recommendation 
} from '@/types/land-verification';

interface ScenarioModelingToolProps {
  baselineRiskFactors: RiskFactorWithContext[];
  onRunScenario: (scenario: RiskScenario) => Promise<ScenarioResult>;
  onSaveScenario: (scenario: RiskScenario) => void;
  className?: string;
}

interface RiskScenario {
  id: string;
  name: string;
  description: string;
  modifications: RiskModification[];
  timeframe: '30d' | '90d' | '1y' | '5y';
  assumptions: string[];
}

interface RiskModification {
  factorId: number;
  type: 'severity_change' | 'impact_change' | 'likelihood_change' | 'mitigation_applied' | 'new_factor';
  originalValue: number;
  newValue: number;
  description: string;
}

interface ScenarioResult {
  scenarioId: string;
  projectedRiskScore: number;
  impactAnalysis: {
    riskChange: number;
    affectedFactors: number;
    confidenceLevel: number;
  };
  recommendations: Recommendation[];
}

const PREDEFINED_SCENARIOS = [
  {
    id: 'mitigation-complete',
    name: 'Full Mitigation Implementation',
    description: 'All recommended mitigation measures are successfully implemented',
    timeframe: '90d' as const,
    assumptions: [
      'All expert recommendations are followed',
      'Legal issues are resolved through proper channels',
      'Government designations are clarified',
      'Physical verification confirms documentation'
    ]
  },
  {
    id: 'worst-case',
    name: 'Worst Case Scenario',
    description: 'Multiple risk factors escalate simultaneously',
    timeframe: '1y' as const,
    assumptions: [
      'Legal disputes escalate to court proceedings',
      'Government claims are enforced',
      'Community opposition intensifies',
      'Market conditions deteriorate'
    ]
  },
  {
    id: 'partial-resolution',
    name: 'Partial Risk Resolution',
    description: 'Some risks are mitigated while others remain',
    timeframe: '90d' as const,
    assumptions: [
      'Major legal issues are resolved',
      'Some government designations remain unclear',
      'Community concerns are partially addressed',
      'Physical verification shows minor discrepancies'
    ]
  }
];

export default function ScenarioModelingTool({
  baselineRiskFactors,
  onRunScenario,
  onSaveScenario,
  className
}: ScenarioModelingToolProps) {
  const [activeTab, setActiveTab] = useState('builder');
  const [currentScenario, setCurrentScenario] = useState<RiskScenario>({
    id: `scenario-${Date.now()}`,
    name: '',
    description: '',
    modifications: [],
    timeframe: '90d',
    assumptions: []
  });
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [newAssumption, setNewAssumption] = useState('');

  const baselineRiskScore = useMemo(() => {
    if (baselineRiskFactors.length === 0) return 0;
    const totalImpact = baselineRiskFactors.reduce((sum, factor) => sum + factor.impact, 0);
    return (totalImpact / baselineRiskFactors.length) * 10; // Scale to 0-100
  }, [baselineRiskFactors]);

  const handleAddModification = (factorId: number) => {
    const factor = baselineRiskFactors.find(f => f.id === factorId);
    if (!factor) return;

    const newModification: RiskModification = {
      factorId,
      type: 'impact_change',
      originalValue: factor.impact,
      newValue: factor.impact,
      description: `Modify ${factor.category} risk factor`
    };

    setCurrentScenario(prev => ({
      ...prev,
      modifications: [...prev.modifications, newModification]
    }));
  };

  const handleUpdateModification = (index: number, updates: Partial<RiskModification>) => {
    setCurrentScenario(prev => ({
      ...prev,
      modifications: prev.modifications.map((mod, i) => 
        i === index ? { ...mod, ...updates } : mod
      )
    }));
  };

  const handleRemoveModification = (index: number) => {
    setCurrentScenario(prev => ({
      ...prev,
      modifications: prev.modifications.filter((_, i) => i !== index)
    }));
  };

  const handleAddAssumption = () => {
    if (newAssumption.trim()) {
      setCurrentScenario(prev => ({
        ...prev,
        assumptions: [...prev.assumptions, newAssumption.trim()]
      }));
      setNewAssumption('');
    }
  };

  const handleRemoveAssumption = (index: number) => {
    setCurrentScenario(prev => ({
      ...prev,
      assumptions: prev.assumptions.filter((_, i) => i !== index)
    }));
  };

  const handleRunScenario = async () => {
    if (!currentScenario.name.trim()) {
      alert('Please provide a scenario name');
      return;
    }

    setIsRunning(true);
    try {
      const result = await onRunScenario(currentScenario);
      setScenarioResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
      setActiveTab('results');
    } catch (error) {
      console.error('Failed to run scenario:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleLoadPredefinedScenario = (predefined: typeof PREDEFINED_SCENARIOS[0]) => {
    const modifications: RiskModification[] = [];
    
    // Generate modifications based on scenario type
    if (predefined.id === 'mitigation-complete') {
      baselineRiskFactors.forEach(factor => {
        if (factor.severity === 'high' || factor.severity === 'critical') {
          modifications.push({
            factorId: factor.id,
            type: 'mitigation_applied',
            originalValue: factor.impact,
            newValue: Math.max(1, factor.impact - 3),
            description: `Apply mitigation for ${factor.category} risk`
          });
        }
      });
    } else if (predefined.id === 'worst-case') {
      baselineRiskFactors.forEach(factor => {
        if (factor.impact < 8) {
          modifications.push({
            factorId: factor.id,
            type: 'impact_change',
            originalValue: factor.impact,
            newValue: Math.min(10, factor.impact + 2),
            description: `Escalation of ${factor.category} risk`
          });
        }
      });
    } else if (predefined.id === 'partial-resolution') {
      baselineRiskFactors.forEach((factor, index) => {
        if (index % 2 === 0 && factor.impact > 3) {
          modifications.push({
            factorId: factor.id,
            type: 'mitigation_applied',
            originalValue: factor.impact,
            newValue: Math.max(1, factor.impact - 2),
            description: `Partial mitigation of ${factor.category} risk`
          });
        }
      });
    }

    setCurrentScenario({
      id: `scenario-${Date.now()}`,
      name: predefined.name,
      description: predefined.description,
      modifications,
      timeframe: predefined.timeframe,
      assumptions: [...predefined.assumptions]
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const ModificationCard = ({ modification, index }: { modification: RiskModification; index: number }) => {
    const factor = baselineRiskFactors.find(f => f.id === modification.factorId);
    if (!factor) return null;

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{factor.category}</h4>
              <p className="text-xs text-muted-foreground">{modification.description}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveModification(index)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Modification Type</Label>
              <Select
                value={modification.type}
                onValueChange={(value) => handleUpdateModification(index, { type: value as any })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="severity_change">Severity Change</SelectItem>
                  <SelectItem value="impact_change">Impact Change</SelectItem>
                  <SelectItem value="likelihood_change">Likelihood Change</SelectItem>
                  <SelectItem value="mitigation_applied">Mitigation Applied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">
                New Value: {modification.newValue}/10
              </Label>
              <Slider
                value={[modification.newValue]}
                onValueChange={([value]) => handleUpdateModification(index, { newValue: value })}
                max={10}
                min={1}
                step={0.5}
                className="mt-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Original: {modification.originalValue}</span>
                <span>Change: {(modification.newValue - modification.originalValue).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ScenarioResultCard = ({ result }: { result: ScenarioResult }) => {
    const riskChange = result.impactAnalysis.riskChange;
    const isImprovement = riskChange < 0;

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Scenario Result</h4>
            <Badge className={cn(
              'text-xs',
              isImprovement 
                ? 'text-green-600 bg-green-50 border-green-200'
                : 'text-red-600 bg-red-50 border-red-200'
            )}>
              {isImprovement ? 'Risk Reduced' : 'Risk Increased'}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold">{Math.round(result.projectedRiskScore)}</div>
              <div className="text-xs text-muted-foreground">Projected Score</div>
            </div>
            <div className="text-center">
              <div className={cn(
                'text-lg font-bold flex items-center justify-center gap-1',
                isImprovement ? 'text-green-600' : 'text-red-600'
              )}>
                {isImprovement ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                {Math.abs(riskChange).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Risk Change</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {Math.round(result.impactAnalysis.confidenceLevel * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium">Key Recommendations:</div>
            {result.recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="text-xs text-muted-foreground">
                • {rec.title}
              </div>
            ))}
            {result.recommendations.length > 2 && (
              <div className="text-xs text-blue-600">
                +{result.recommendations.length - 2} more recommendations
              </div>
            )}
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
              <Calculator className="h-5 w-5" />
              Scenario Modeling & What-If Analysis
            </CardTitle>
            <CardDescription>
              Model different scenarios to understand potential risk changes
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentScenario({
                id: `scenario-${Date.now()}`,
                name: '',
                description: '',
                modifications: [],
                timeframe: '90d',
                assumptions: []
              })}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSaveScenario(currentScenario)}
              disabled={!currentScenario.name.trim()}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Baseline Risk Display */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Baseline Risk Score</div>
              <div className="text-xs text-muted-foreground">
                Based on {baselineRiskFactors.length} risk factors
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(baselineRiskScore)}/100</div>
              <div className="text-xs text-muted-foreground">Current Assessment</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="builder">Scenario Builder</TabsTrigger>
            <TabsTrigger value="predefined">Templates</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            {/* Scenario Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scenario Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Scenario Name</Label>
                    <Input
                      value={currentScenario.name}
                      onChange={(e) => setCurrentScenario(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter scenario name"
                    />
                  </div>
                  <div>
                    <Label>Timeframe</Label>
                    <Select
                      value={currentScenario.timeframe}
                      onValueChange={(value) => setCurrentScenario(prev => ({ ...prev, timeframe: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30d">30 Days</SelectItem>
                        <SelectItem value="90d">90 Days</SelectItem>
                        <SelectItem value="1y">1 Year</SelectItem>
                        <SelectItem value="5y">5 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={currentScenario.description}
                    onChange={(e) => setCurrentScenario(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the scenario and its key assumptions"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Risk Factor Modifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Risk Factor Modifications</CardTitle>
                  <Select onValueChange={(value) => handleAddModification(parseInt(value))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add modification" />
                    </SelectTrigger>
                    <SelectContent>
                      {baselineRiskFactors.map(factor => (
                        <SelectItem key={factor.id} value={factor.id.toString()}>
                          {factor.category} - {factor.severity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {currentScenario.modifications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentScenario.modifications.map((modification, index) => (
                      <ModificationCard
                        key={index}
                        modification={modification}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No modifications added yet</p>
                    <p className="text-sm">Select risk factors above to modify them in this scenario</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assumptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scenario Assumptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newAssumption}
                    onChange={(e) => setNewAssumption(e.target.value)}
                    placeholder="Add an assumption about this scenario"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAssumption()}
                  />
                  <Button onClick={handleAddAssumption} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {currentScenario.assumptions.length > 0 && (
                  <div className="space-y-2">
                    {currentScenario.assumptions.map((assumption, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{assumption}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssumption(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Run Scenario */}
            <div className="flex justify-center">
              <Button
                onClick={handleRunScenario}
                disabled={isRunning || !currentScenario.name.trim()}
                size="lg"
              >
                <Play className={cn('h-4 w-4 mr-2', isRunning && 'animate-pulse')} />
                {isRunning ? 'Running Analysis...' : 'Run Scenario Analysis'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="predefined" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PREDEFINED_SCENARIOS.map(scenario => (
                <Card key={scenario.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{scenario.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {scenario.timeframe}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleLoadPredefinedScenario(scenario)}
                      >
                        Load Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {scenarioResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarioResults.map((result, index) => (
                  <ScenarioResultCard key={index} result={result} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Scenario Results Yet</h3>
                <p className="mb-4">
                  Create and run scenarios to see projected risk analysis results
                </p>
                <Button onClick={() => setActiveTab('builder')}>
                  Create Scenario
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}