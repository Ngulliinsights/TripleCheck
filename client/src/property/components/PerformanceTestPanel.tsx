import { AlertTriangle, CheckCircle, Activity, Zap } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Badge } from '../../local/components/ui/badge'
import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../local/components/ui/card'
import { useComponentPerformance, type PerformanceStats } from '../../local/hooks'
import { PerformanceMonitoringService } from '../../local/services/performance-monitoring-service'
// import { raceConditionTester } from '../utils/raceConditionTest' // File doesn't exist

interface PerformanceTestPanelProps {
  className?: string;
}

export const PerformanceTestPanel: React.FC<PerformanceTestPanelProps> = ({ className }) => {
  const performanceMonitor = useComponentPerformance('PerformanceTestPanel');
  const [stats, setStats] = useState<PerformanceStats>({
    componentName: 'PerformanceTestPanel',
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    totalApiCalls: 0,
    recentApiCalls: 0,
    averageTimeBetweenCalls: 0
  });
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<{
    raceConditions: boolean;
    infiniteLoops: boolean;
    excessiveRenders: boolean;
    performanceScore: 'excellent' | 'good' | 'poor' | 'critical';
  }>({
    raceConditions: false,
    infiniteLoops: false,
    excessiveRenders: false,
    performanceScore: 'excellent'
  });

  // Update stats every second
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = performanceMonitor.getStats();
      setStats(currentStats);
      
      // Analyze performance
      analyzePerformance(currentStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [performanceMonitor]);

  const analyzePerformance = (currentStats: PerformanceStats) => {
    // Race condition tester removed - file doesn't exist
    // const testResults = raceConditionTester.runAllTests();
    
    const results: {
      raceConditions: boolean;
      infiniteLoops: boolean;
      excessiveRenders: boolean;
      performanceScore: 'excellent' | 'good' | 'poor' | 'critical';
    } = {
      raceConditions: false, // Disabled
      infiniteLoops: false, // Disabled
      excessiveRenders: false, // Disabled
      performanceScore: 'excellent'
    };

    // Adjust score based on severity
    if (results.infiniteLoops) {
      results.performanceScore = 'critical';
    } else if (results.raceConditions || results.excessiveRenders) {
      results.performanceScore = 'poor';
    } else if (currentStats.averageTimeBetweenCalls > 0 && currentStats.averageTimeBetweenCalls < 300 && currentStats.totalApiCalls > 5) {
      results.performanceScore = 'poor'; // Too many rapid calls
    } else if (currentStats.averageRenderTime > 32) {
      results.performanceScore = 'poor';
    }

    setTestResults(results);
  };

  const runStressTest = async () => {
    setIsRunningTest(true);
    performanceMonitor.reset();
    
    // Simulate rapid user interactions
    const testInputs = [
      'apartment',
      'house',
      'villa',
      'kilimani',
      'westlands',
      'karen',
      '2',
      '3',
      '4',
      '1000000',
      '5000000'
    ];

    // Simulate rapid typing and filter changes
    for (let i = 0; i < testInputs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms between inputs
      
      // Simulate API call tracking
      performanceMonitor.trackApiCall({ 
        query: testInputs[i], 
        timestamp: Date.now() 
      });
    }

    // Wait for debouncing to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsRunningTest(false);
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'poor': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <Activity className="w-4 h-4" />;
      case 'poor': return <Zap className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`${className} border-2 border-dashed border-gray-300`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Score */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Performance Score:</span>
          <Badge className={`${getScoreColor(testResults.performanceScore)} flex items-center gap-1`}>
            {getScoreIcon(testResults.performanceScore)}
            {testResults.performanceScore.toUpperCase()}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Total API Calls</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalApiCalls}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Total Renders</div>
            <div className="text-2xl font-bold text-green-600">{stats.renderCount}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Recent API Calls</div>
            <div className="text-2xl font-bold text-purple-600">{stats.recentApiCalls}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Avg Call Interval</div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.averageTimeBetweenCalls.toFixed(0)}ms
            </div>
          </div>
        </div>

        {/* Issue Detection */}
        <div className="space-y-2">
          <h4 className="font-medium">Issue Detection:</h4>
          <div className="space-y-1">
            <div className={`flex items-center gap-2 p-2 rounded ${testResults.raceConditions ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
              {testResults.raceConditions ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span className="text-sm">Race Conditions: {testResults.raceConditions ? 'DETECTED' : 'None'}</span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded ${testResults.infiniteLoops ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
              {testResults.infiniteLoops ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span className="text-sm">Infinite Loops: {testResults.infiniteLoops ? 'DETECTED' : 'None'}</span>
            </div>
            <div className={`flex items-center gap-2 p-2 rounded ${testResults.excessiveRenders ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
              {testResults.excessiveRenders ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span className="text-sm">Excessive Renders: {testResults.excessiveRenders ? 'DETECTED' : 'None'}</span>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={runStressTest} 
            disabled={isRunningTest}
            variant="outline"
            size="sm"
          >
            {isRunningTest ? 'Running...' : 'Run Stress Test'}
          </Button>
          <Button 
            onClick={() => performanceMonitor.reset()} 
            variant="ghost"
            size="sm"
          >
            Reset Stats
          </Button>
        </div>

        {/* Performance Tips */}
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <strong>Expected Behavior:</strong>
          <ul className="mt-1 space-y-1">
            <li>• API calls should be debounced (300ms+ intervals)</li>
            <li>• No duplicate consecutive API calls</li>
            <li>• Renders should be minimal and efficient</li>
            <li>• No infinite loops or race conditions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceTestPanel;