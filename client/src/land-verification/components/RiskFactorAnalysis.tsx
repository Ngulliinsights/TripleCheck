import { Alert, AlertDescription } from '../../local/components/ui/alert'
import { Badge } from '../../local/components/ui/badge'
import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Input } from '../../local/components/ui/input'
import { Label } from '../../local/components/ui/label'
import { Progress } from '../../local/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../local/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../local/components/ui/tabs'
import { cn } from '../../local/lib/utils'
import { 
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Info,
  ChevronRight
} from 'lucide-react'
import React, { useState, useMemo } from 'react'

import type { 
  RiskFactorWithContext,
  RiskInteraction,
  RiskLevel,
  RiskCategory 
} from '@/types/land-verification'

interface RiskFactorAnalysisProps {
  riskFactors: RiskFactorWithContext[];
  riskInteractions: RiskInteraction[];
  onFactorUpdate: (factorId: number, updates: Partial<RiskFactorWithContext>) => void;
  className?: string;
}

interface FilterOptions {
  category: RiskCategory | 'all';
  severity: RiskLevel | 'all';
  mitigationStatus: 'all' | 'none' | 'planned' | 'in_progress' | 'completed';
  searchTerm: string;
}

interface SortOptions {
  field: 'impact' | 'severity' | 'category' | 'mitigationStatus';
  direction: 'asc' | 'desc';
}

export default function RiskFactorAnalysis({
  riskFactors,
  riskInteractions,
  onFactorUpdate,
  className
}: RiskFactorAnalysisProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    severity: 'all',
    mitigationStatus: 'all',
    searchTerm: ''
  });
  const [sort, setSort] = useState<SortOptions>({
    field: 'impact',
    direction: 'desc'
  });
  const [selectedFactor, setSelectedFactor] = useState<RiskFactorWithContext | null>(null);
  const [activeTab, setActiveTab] = useState('factors');

  // Filter and sort risk factors
  const filteredAndSortedFactors = useMemo(() => {
    const filtered = riskFactors.filter(factor => {
      if (filters.category !== 'all' && factor.category !== filters.category) return false;
      if (filters.severity !== 'all' && factor.severity !== filters.severity) return false;
      if (filters.mitigationStatus !== 'all' && factor.mitigationStatus !== filters.mitigationStatus) return false;
      if (filters.searchTerm && !factor.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      let aValue: any = a[sort.field];
      let bValue: any = b[sort.field];

      if (sort.field === 'severity') {
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        aValue = severityOrder[a.severity as keyof typeof severityOrder];
        bValue = severityOrder[b.severity as keyof typeof severityOrder];
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [riskFactors, filters, sort]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const total = riskFactors.length;
    const bySeverity = {
      critical: riskFactors.filter(f => f.severity === 'critical').length,
      high: riskFactors.filter(f => f.severity === 'high').length,
      medium: riskFactors.filter(f => f.severity === 'medium').length,
      low: riskFactors.filter(f => f.severity === 'low').length
    };
    const byCategory = {
      ownership: riskFactors.filter(f => f.category === 'ownership').length,
      government: riskFactors.filter(f => f.category === 'government').length,
      legal: riskFactors.filter(f => f.category === 'legal').length,
      physical: riskFactors.filter(f => f.category === 'physical').length,
      community: riskFactors.filter(f => f.category === 'community').length
    };
    const byMitigation = {
      none: riskFactors.filter(f => f.mitigationStatus === 'none').length,
      planned: riskFactors.filter(f => f.mitigationStatus === 'planned').length,
      in_progress: riskFactors.filter(f => f.mitigationStatus === 'in_progress').length,
      completed: riskFactors.filter(f => f.mitigationStatus === 'completed').length
    };
    const averageImpact = total > 0 ? riskFactors.reduce((sum, f) => sum + f.impact, 0) / total : 0;

    return { total, bySeverity, byCategory, byMitigation, averageImpact };
  }, [riskFactors]);

  const getSeverityColor = (severity: RiskLevel): string => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getMitigationStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'planned': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const RiskFactorCard = ({ factor }: { factor: RiskFactorWithContext }) => {
    const relatedInteractions = riskInteractions.filter(
      i => i.primaryFactorId === factor.id || i.secondaryFactorId === factor.id
    );

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedFactor(factor)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm capitalize">{factor.category}</h4>
                <Badge className={cn('text-xs', getSeverityColor(factor.severity as RiskLevel))}>
                  {factor.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{factor.description}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{factor.impact}/10</div>
              <div className="text-xs text-muted-foreground">Impact</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Mitigation Status:</span>
              <Badge className={cn('text-xs', getMitigationStatusColor(factor.mitigationStatus))}>
                {factor.mitigationStatus.replace('_', ' ')}
              </Badge>
            </div>

            {factor.mitigationCost && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Mitigation Cost:</span>
                <span className="text-xs font-medium">KES {factor.mitigationCost.toLocaleString()}</span>
              </div>
            )}

            {relatedInteractions.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Interactions:</span>
                <span className="text-xs font-medium">{relatedInteractions.length}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              View Details
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const InteractionCard = ({ interaction }: { interaction: RiskInteraction }) => {
    const primaryFactor = riskFactors.find(f => f.id === interaction.primaryFactorId);
    const secondaryFactor = riskFactors.find(f => f.id === interaction.secondaryFactorId);

    if (!primaryFactor || !secondaryFactor) return null;

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="capitalize text-xs">
              {interaction.interactionType}
            </Badge>
            <div className="flex items-center gap-1">
              {interaction.impactMultiplier > 1 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
              <span className="text-sm font-medium">
                {interaction.impactMultiplier.toFixed(1)}x
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="text-sm">
              <span className="font-medium">{primaryFactor.category}</span>
              <span className="text-muted-foreground"> → </span>
              <span className="font-medium">{secondaryFactor.category}</span>
            </div>
            <p className="text-sm text-muted-foreground">{interaction.description}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <div className="flex items-center gap-2">
              <Progress value={interaction.confidence * 100} className="h-1 w-16" />
              <span className="text-xs font-medium">
                {Math.round(interaction.confidence * 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const FactorDetailModal = ({ factor }: { factor: RiskFactorWithContext }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize">{factor.category} Risk Factor</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setSelectedFactor(null)}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Description</Label>
          <p className="text-sm text-muted-foreground mt-1">{factor.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Severity</Label>
            <Badge className={cn('mt-1', getSeverityColor(factor.severity as RiskLevel))}>
              {factor.severity}
            </Badge>
          </div>
          <div>
            <Label className="text-sm font-medium">Impact Score</Label>
            <div className="mt-1">
              <Progress value={factor.impact * 10} className="h-2" />
              <span className="text-sm font-medium">{factor.impact}/10</span>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Mitigation Status</Label>
          <div className="mt-1">
            <Badge className={cn('text-xs', getMitigationStatusColor(factor.mitigationStatus))}>
              {factor.mitigationStatus.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {factor.mitigationCost && (
          <div>
            <Label className="text-sm font-medium">Estimated Mitigation Cost</Label>
            <p className="text-sm font-medium mt-1">KES {factor.mitigationCost.toLocaleString()}</p>
          </div>
        )}

        {factor.mitigationTimeframe && (
          <div>
            <Label className="text-sm font-medium">Mitigation Timeframe</Label>
            <p className="text-sm text-muted-foreground mt-1">{factor.mitigationTimeframe}</p>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button size="sm" onClick={() => onFactorUpdate(factor.id, { mitigationStatus: 'planned' })}>
            <Edit className="h-4 w-4 mr-2" />
            Update Status
          </Button>
          <Button variant="outline" size="sm">
            View Related Factors
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      {selectedFactor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <FactorDetailModal factor={selectedFactor} />
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Risk Factor Analysis</CardTitle>
              <CardDescription>
                Detailed analysis of individual risk factors and their interactions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{analytics.total} factors</Badge>
              <Badge variant="outline">{riskInteractions.length} interactions</Badge>
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-red-600">{analytics.bySeverity.critical + analytics.bySeverity.high}</div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-yellow-600">{analytics.bySeverity.medium}</div>
                <div className="text-xs text-muted-foreground">Medium Risk</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-green-600">{analytics.bySeverity.low}</div>
                <div className="text-xs text-muted-foreground">Low Risk</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold">{analytics.averageImpact.toFixed(1)}/10</div>
                <div className="text-xs text-muted-foreground">Avg Impact</div>
              </CardContent>
            </Card>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="factors">Risk Factors</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
            </TabsList>

            <TabsContent value="factors" className="space-y-4">
              {/* Filters and Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label className="text-xs">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search factors..."
                          value={filters.searchTerm}
                          onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                          className="pl-8 h-9"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Category</Label>
                      <Select
                        value={filters.category}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, category: value as any }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="ownership">Ownership</SelectItem>
                          <SelectItem value="government">Government</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="physical">Physical</SelectItem>
                          <SelectItem value="community">Community</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Severity</Label>
                      <Select
                        value={filters.severity}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value as any }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Severities</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Mitigation</Label>
                      <Select
                        value={filters.mitigationStatus}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, mitigationStatus: value as any }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Sort By</Label>
                      <div className="flex gap-1">
                        <Select
                          value={sort.field}
                          onValueChange={(value) => setSort(prev => ({ ...prev, field: value as any }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="impact">Impact</SelectItem>
                            <SelectItem value="severity">Severity</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="mitigationStatus">Mitigation</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSort(prev => ({ 
                            ...prev, 
                            direction: prev.direction === 'asc' ? 'desc' : 'asc' 
                          }))}
                        >
                          {sort.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factors Grid */}
              {filteredAndSortedFactors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedFactors.map(factor => (
                    <RiskFactorCard key={factor.id} factor={factor} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Filter className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Risk Factors Found</h3>
                  <p>Try adjusting your filters to see more results</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4">
              {riskInteractions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {riskInteractions.map(interaction => (
                    <InteractionCard key={interaction.id} interaction={interaction} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Risk Interactions</h3>
                  <p>No interactions detected between risk factors</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}