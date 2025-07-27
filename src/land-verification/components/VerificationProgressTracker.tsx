import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Progress } from '@shared/components/ui/progress';
import { Button } from '@shared/components/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Play, 
  Pause,
  FileText,
  MapPin,
  Users,
  Building,
  Scale,
  UserCheck
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { 
  VerificationLayerWithResults, 
  LayerType,
  VerificationStatus 
} from '@/types/land-verification';

interface VerificationProgressTrackerProps {
  sessionId: number;
  layers: VerificationLayerWithResults[];
  onLayerAction: (layerId: number, action: 'start' | 'pause' | 'resume' | 'view') => void;
  className?: string;
}

const LAYER_ICONS: Record<LayerType, React.ElementType> = {
  registry: FileText,
  physical: MapPin,
  community: Users,
  government: Building,
  legal: Scale,
  expert: UserCheck
};

const LAYER_DESCRIPTIONS: Record<LayerType, string> = {
  registry: 'Verify land registry records and ownership history',
  physical: 'Ground-truth property boundaries and physical features',
  community: 'Gather intelligence from local community members',
  government: 'Check government designations and restrictions',
  legal: 'Investigate legal history and court records',
  expert: 'Professional assessment by qualified experts'
};

export default function VerificationProgressTracker({
  sessionId,
  layers,
  onLayerAction,
  className
}: VerificationProgressTrackerProps) {
  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: VerificationStatus): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'suspended':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getActionButton = (layer: VerificationLayerWithResults) => {
    switch (layer.completionStatus) {
      case 'not_started':
        return (
          <Button
            size="sm"
            onClick={() => onLayerAction(layer.id, 'start')}
            className="flex items-center gap-1"
          >
            <Play className="h-3 w-3" />
            Start
          </Button>
        );
      case 'in_progress':
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLayerAction(layer.id, 'pause')}
              className="flex items-center gap-1"
            >
              <Pause className="h-3 w-3" />
              Pause
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLayerAction(layer.id, 'view')}
            >
              View
            </Button>
          </div>
        );
      case 'completed':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onLayerAction(layer.id, 'view')}
          >
            View Results
          </Button>
        );
      case 'failed':
        return (
          <Button
            size="sm"
            onClick={() => onLayerAction(layer.id, 'start')}
            className="flex items-center gap-1"
          >
            <Play className="h-3 w-3" />
            Retry
          </Button>
        );
      default:
        return null;
    }
  };

  const overallProgress = layers.length > 0 
    ? layers.reduce((acc, layer) => acc + layer.progressPercentage, 0) / layers.length 
    : 0;

  const completedLayers = layers.filter(l => l.completionStatus === 'completed').length;
  const inProgressLayers = layers.filter(l => l.completionStatus === 'in_progress').length;
  const failedLayers = layers.filter(l => l.completionStatus === 'failed').length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Verification Progress</CardTitle>
            <CardDescription>
              Track progress across all verification layers
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
            <div className="text-sm text-muted-foreground">
              {completedLayers}/{layers.length} layers complete
            </div>
          </div>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{completedLayers}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{inProgressLayers}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{failedLayers}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        {/* Layer Details */}
        <div className="space-y-3">
          {layers.map((layer) => {
            const Icon = LAYER_ICONS[layer.layerType as LayerType];
            
            return (
              <div
                key={layer.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(layer.completionStatus)}
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">
                        {layer.layerType.charAt(0).toUpperCase() + layer.layerType.slice(1)} Verification
                      </h4>
                      <Badge className={cn('text-xs', getStatusColor(layer.completionStatus))}>
                        {layer.completionStatus.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {LAYER_DESCRIPTIONS[layer.layerType as LayerType]}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress value={layer.progressPercentage} className="h-1" />
                      </div>
                      <span className="text-xs text-muted-foreground min-w-[3rem]">
                        {layer.progressPercentage}%
                      </span>
                    </div>
                    
                    {/* Blockers */}
                    {layer.blockers && layer.blockers.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          Blockers: {layer.blockers.join(', ')}
                        </div>
                      </div>
                    )}
                    
                    {/* Next Steps */}
                    {layer.nextSteps && layer.nextSteps.length > 0 && (
                      <div className="mt-1">
                        <div className="text-xs text-muted-foreground">
                          Next: {layer.nextSteps[0]}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-4">
                  {getActionButton(layer)}
                </div>
              </div>
            );
          })}
        </div>

        {layers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No verification layers configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}