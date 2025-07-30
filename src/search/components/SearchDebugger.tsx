/**
 * OperationDebugger - Visual debugging interface for race conditions
 * 
 * This component provides a real-time visual interface for monitoring
 * and debugging race conditions in React applications. It displays
 * operation timelines, race condition patterns, and debugging insights.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import { operationTracker, OperationRecord, RaceConditionPattern } from '@/infrastructure/monitoring/operation-tracker';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Zap, 
  RefreshCw, 
  Trash2, 
  Download,
  Eye,
  EyeOff,
  Play,
  Pause
} from 'lucide-react';

interface OperationDebuggerProps {
  /** Whether to show the debugger by default */
  defaultVisible?: boolean;
  /** Position of the debugger on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'fullscreen';
  /** Whether to auto-refresh the display */
  autoRefresh?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

export function OperationDebugger({
  defaultVisible = false,
  position = 'bottom-right',
  autoRefresh = true,
  refreshInterval = 1000
}: OperationDebuggerProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [isPaused, setIsPaused] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [selectedOperation, setSelectedOperation] = useState<OperationRecord | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Update debug data
  const updateDebugData = useCallback(() => {
    if (!isPaused) {
      const report = operationTracker.getDebugReport();
      const recentOperations = operationTracker.queryOperations({ limit: 50 });
      const raceConditions = operationTracker.analyzeRaceConditions();
      
      setDebugData({
        ...report,
        recentOperations,
        raceConditions
      });
    }
  }, [isPaused]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isVisible && !isPaused) {
      const interval = setInterval(updateDebugData, refreshInterval);
      updateDebugData(); // Initial update
      return () => clearInterval(interval);
    }
    return () => {}; // Return empty cleanup function when condition is false
  }, [autoRefresh, isVisible, isPaused, refreshInterval, updateDebugData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(!isVisible);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsPaused(!isPaused);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, isPaused]);

  const handleClearTracking = () => {
    operationTracker.clear();
    setDebugData(null);
    setSelectedOperation(null);
  };

  const handleExportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      debugReport: debugData,
      timeline: operationTracker.generateTimeline()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operation-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getOperationStatusColor = (operation: OperationRecord) => {
    if (operation.isActive) return 'bg-blue-500';
    if (operation.milestones.some(m => m.status === 'failed')) return 'bg-red-500';
    if (operation.milestones.some(m => m.status === 'completed')) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'fixed bottom-4 right-4 w-96 h-96';
      case 'bottom-left':
        return 'fixed bottom-4 left-4 w-96 h-96';
      case 'top-right':
        return 'fixed top-4 right-4 w-96 h-96';
      case 'top-left':
        return 'fixed top-4 left-4 w-96 h-96';
      case 'fullscreen':
        return 'fixed inset-4 w-auto h-auto';
      default:
        return 'fixed bottom-4 right-4 w-96 h-96';
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0"
        title="Open Operation Debugger (Ctrl+Shift+D)"
      >
        <Activity className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className={`${getPositionClasses()} z-50 bg-white border border-gray-300 rounded-lg shadow-2xl`}>
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Operation Debugger
              {debugData?.raceConditions?.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {debugData.raceConditions.length} Issues
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Resume (Ctrl+Shift+P)' : 'Pause (Ctrl+Shift+P)'}
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={updateDebugData}
                title="Refresh"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExportData}
                title="Export Debug Data"
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearTracking}
                title="Clear All Data"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                title="Hide Debugger"
              >
                <EyeOff className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-2 h-full overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4 text-xs">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="races">Race Conditions</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-2 h-full">
              <ScrollArea className="h-full">
                {debugData?.summary && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="font-medium">Total Operations</div>
                        <div className="text-lg font-bold">{debugData.summary.totalOperations}</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="font-medium">Active</div>
                        <div className="text-lg font-bold text-green-600">{debugData.summary.activeOperations}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">Completed</div>
                        <div className="text-lg font-bold">{debugData.summary.completedOperations}</div>
                      </div>
                      <div className="bg-red-50 p-2 rounded">
                        <div className="font-medium">Failed</div>
                        <div className="text-lg font-bold text-red-600">{debugData.summary.failedOperations}</div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-2 rounded">
                      <div className="font-medium text-xs">Average Duration</div>
                      <div className="text-lg font-bold">{formatDuration(debugData.summary.averageDuration)}</div>
                    </div>

                    {debugData.recommendations && (
                      <div className="space-y-1">
                        <div className="font-medium text-xs">Recommendations:</div>
                        {debugData.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="text-xs bg-blue-50 p-2 rounded">
                            {rec}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="operations" className="mt-2 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-1">
                  {debugData?.recentOperations?.map((op: OperationRecord) => (
                    <div
                      key={op.id}
                      className={`p-2 rounded text-xs cursor-pointer hover:bg-gray-50 ${
                        selectedOperation?.id === op.id ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedOperation(op)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getOperationStatusColor(op)}`} />
                          <span className="font-medium truncate">{op.description}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {op.type}
                        </Badge>
                      </div>
                      <div className="text-gray-500 mt-1">
                        {op.context} • {op.duration ? formatDuration(op.duration) : 'Active'}
                      </div>
                      {op.dependencies.length > 0 && (
                        <div className="text-gray-400 text-xs mt-1">
                          Depends on: {op.dependencies.length} operations
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="races" className="mt-2 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {debugData?.raceConditions?.length > 0 ? (
                    debugData.raceConditions.map((pattern: RaceConditionPattern, index: number) => (
                      <div key={index} className="p-2 rounded border border-red-200 bg-red-50">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <Badge className={`text-xs ${getSeverityColor(pattern.severity)} text-white`}>
                            {pattern.severity}
                          </Badge>
                          <span className="text-xs font-medium">{pattern.type}</span>
                        </div>
                        <div className="text-xs text-gray-700 mb-2">
                          {pattern.description}
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
                          💡 {pattern.suggestion}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Operations: {pattern.operationIds.join(', ')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 text-xs py-4">
                      ✅ No race conditions detected
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="timeline" className="mt-2 h-full">
              <ScrollArea className="h-full">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {debugData?.timeline || 'No timeline data available'}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Operation Detail Modal */}
      {selectedOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <Card className="w-96 max-h-96 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Operation Details
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedOperation(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2 text-xs">
                  <div><strong>ID:</strong> {selectedOperation.id}</div>
                  <div><strong>Type:</strong> {selectedOperation.type}</div>
                  <div><strong>Description:</strong> {selectedOperation.description}</div>
                  <div><strong>Context:</strong> {selectedOperation.context}</div>
                  <div><strong>Duration:</strong> {selectedOperation.duration ? formatDuration(selectedOperation.duration) : 'Active'}</div>
                  <div><strong>Dependencies:</strong> {selectedOperation.dependencies.length}</div>
                  <div><strong>Children:</strong> {selectedOperation.children.length}</div>
                  
                  <div className="mt-3">
                    <strong>Milestones:</strong>
                    <div className="ml-2 space-y-1">
                      {selectedOperation.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {milestone.status}
                          </Badge>
                          <span>{formatDuration(milestone.timestamp - selectedOperation.startTime)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <strong>Call Stack:</strong>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {selectedOperation.callStack}
                    </pre>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default OperationDebugger;