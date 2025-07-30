import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GlobalPerformanceMonitor } from '../utils/globalPerformanceMonitor';
import { raceConditionTester } from '../../property/utils/raceConditionTest';
import { AlertTriangle, CheckCircle, Activity, Zap, BarChart3, Monitor } from 'lucide-react';

interface GlobalPerformanceTestPanelProps {
  className?: string;
  defaultVisible?: boolean;
}

export const GlobalPerformanceTestPanel: React.FC<GlobalPerformanceTestPanelProps> = ({ 
  className,
  defaultVisible = false 
}) => {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [allStats, setAllStats] = useState<Record<string, any>>({});
  const [globalIssues, setGlobalIssues] = useState<string[]>([]);
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

  const monitor = GlobalPerformanceMonitor.getInstance();

  // Update stats every 2 seconds
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const stats = monitor.getAllComponentStats();
      const issues = monitor.getGlobalPerformanceIssues();
      
      setAllStats(stats);
      setGlobalIssues(issues);
      
      // Analyze performance across all components
      analyzeGlobalPerformance(stats);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible, monitor]);

  const analyzeGlobalPerformance = (stats: Record<string, any>) => {
    // Use the enhanced race condition tester
    const testResults = raceConditionTester.runAllTests();
    
    const results = {
      raceConditions: !testResults.tests.raceConditions.passed,
      infiniteLoops: !testResults.tests.debouncing.passed,
      excessiveRenders: !testResults.tests.excessiveRenders.passed,
      performanceScore: testResults.overall === 'PASS' ? 'excellent' as const : 'poor' as const
    };

    // Adjust score based on global issues
    const totalApiCalls = Object.values(stats).reduce((sum: number, stat: any) => sum + stat.totalApiCalls, 0);
    const avgCallInterval = Object.values(stats).reduce((sum: number, stat: any) => sum + stat.averageTimeBetweenCalls, 0) / Object.keys(stats).length;

    if (results.infiniteLoops || globalIssues.length > 5) {
      results.performanceScore = 'poor' as const;
    } else if (results.raceConditions || results.excessiveRenders || globalIssues.length > 2) {
      results.performanceScore = 'poor' as const;
    } else if (avgCallInterval < 300 && totalApiCalls > 10) {
      results.performanceScore = 'excellent' as const;
    }

    setTestResults(results);
  };

  const runGlobalStressTest = async () => {
    setIsRunningTest(true);
    monitor.reset(); // Reset all component stats
    
    // Simulate stress test across different component types
    const testScenarios = [
      { component: 'PropertySearch', data: { query: 'apartment', location: 'nairobi' } },
      { component: 'PropertyFilter', data: { type: 'residential', price: 1000000 } },
      { component: 'UserDashboard', data: { userId: 'test-123', tab: 'properties' } },
      { component: 'PropertyList', data: { page: 1, limit: 20 } },
      { component: 'SearchResults', data: { query: 'villa', filters: { bedrooms: 3 } } },
    ];

    // Simulate rapid interactions across components
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      
      if (!scenario) continue;
      
      // Simulate multiple rapid calls for each component
      for (let j = 0; j < 3; j++) {
        await new Promise(resolve => setTimeout(resolve, 30)); // 30ms between calls
        
        monitor.trackApiCall(scenario.component, {
          ...scenario.data,
          timestamp: Date.now(),
          iteration: j
        });
        
        monitor.trackRender(scenario.component);
      }
    }

    // Wait for analysis to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="shadow-lg bg-white hover:bg-gray-50"
        >
          <Monitor className="w-4 h-4 mr-2" />
          Performance Monitor
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden">
      <Card className={`${className} border-2 border-dashed border-gray-300 shadow-xl bg-white`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4" />
              Global Performance Monitor
            </CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 text-xs">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              {/* Performance Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance Score:</span>
                <Badge className={`${getScoreColor(testResults.performanceScore)} flex items-center gap-1 text-xs`}>
                  {getScoreIcon(testResults.performanceScore)}
                  {testResults.performanceScore.toUpperCase()}
                </Badge>
              </div>

              {/* Global Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {Object.keys(allStats).length}
                  </div>
                  <div className="text-xs text-gray-600">Active Components</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-green-600">
                    {Object.values(allStats).reduce((sum: number, stat: any) => sum + stat.totalApiCalls, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total API Calls</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {Object.values(allStats).reduce((sum: number, stat: any) => sum + stat.totalRenders, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Renders</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-red-600">
                    {globalIssues.length}
                  </div>
                  <div className="text-xs text-gray-600">Issues Detected</div>
                </div>
              </div>

              {/* Test Controls */}
              <div className="flex gap-2">
                <Button 
                  onClick={runGlobalStressTest} 
                  disabled={isRunningTest}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {isRunningTest ? 'Running...' : 'Stress Test'}
                </Button>
                <Button 
                  onClick={() => monitor.reset()} 
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Reset All
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-2">
              {Object.entries(allStats).map(([componentName, stats]) => (
                <div key={componentName} className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-sm mb-1">{componentName}</div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div>
                      <span className="text-gray-600">API:</span> {stats.totalApiCalls}
                    </div>
                    <div>
                      <span className="text-gray-600">Renders:</span> {stats.totalRenders}
                    </div>
                    <div>
                      <span className="text-gray-600">Avg:</span> {Math.round(stats.averageTimeBetweenCalls)}ms
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(allStats).length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  No components being monitored
                </div>
              )}
            </TabsContent>

            <TabsContent value="issues" className="space-y-2">
              {/* Issue Detection */}
              <div className="space-y-1">
                <div className={`flex items-center gap-2 p-2 rounded text-xs ${testResults.raceConditions ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
                  {testResults.raceConditions ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  <span>Race Conditions: {testResults.raceConditions ? 'DETECTED' : 'None'}</span>
                </div>
                <div className={`flex items-center gap-2 p-2 rounded text-xs ${testResults.infiniteLoops ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                  {testResults.infiniteLoops ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  <span>Infinite Loops: {testResults.infiniteLoops ? 'DETECTED' : 'None'}</span>
                </div>
                <div className={`flex items-center gap-2 p-2 rounded text-xs ${testResults.excessiveRenders ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
                  {testResults.excessiveRenders ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  <span>Excessive Renders: {testResults.excessiveRenders ? 'DETECTED' : 'None'}</span>
                </div>
              </div>

              {/* Global Issues */}
              {globalIssues.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-red-600">Performance Issues:</div>
                  {globalIssues.slice(0, 5).map((issue, index) => (
                    <div key={index} className="text-xs bg-red-50 text-red-700 p-2 rounded">
                      {issue}
                    </div>
                  ))}
                </div>
              )}

              {globalIssues.length === 0 && !testResults.raceConditions && !testResults.infiniteLoops && !testResults.excessiveRenders && (
                <div className="text-center text-green-600 text-sm py-4">
                  No performance issues detected
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalPerformanceTestPanel;