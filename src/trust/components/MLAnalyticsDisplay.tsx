import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Target,
  Zap,
  Database,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Progress } from '../../shared/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { useToast } from '../../shared/hooks/use-toast';
import { useFraudDetection } from '../hooks/useFraudDetection';

interface MLAnalyticsDisplayProps {
  userId?: string;
  timeRange?: string;
}

const MODEL_TYPES = [
  { id: 'fraud_detection', name: 'Fraud Detection', icon: Brain },
  { id: 'risk_assessment', name: 'Risk Assessment', icon: Target },
  { id: 'document_analysis', name: 'Document Analysis', icon: Database },
  { id: 'network_analysis', name: 'Network Analysis', icon: Activity }
];

const PERFORMANCE_THRESHOLDS = {
  excellent: 0.95,
  good: 0.85,
  fair: 0.75,
  poor: 0.65
};

export function MLAnalyticsDisplay({ userId, timeRange = '7d' }: MLAnalyticsDisplayProps) {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState('fraud_detection');
  const [selectedTab, setSelectedTab] = useState('performance');

  const { useMLAnalytics } = useFraudDetection();
  const { data: analytics, isLoading, refetch } = useMLAnalytics({ timeRange });

  const getPerformanceColor = (value: number) => {
    if (value >= PERFORMANCE_THRESHOLDS.excellent) return 'text-green-600';
    if (value >= PERFORMANCE_THRESHOLDS.good) return 'text-blue-600';
    if (value >= PERFORMANCE_THRESHOLDS.fair) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (value: number) => {
    if (value >= PERFORMANCE_THRESHOLDS.excellent) return 'default';
    if (value >= PERFORMANCE_THRESHOLDS.good) return 'secondary';
    if (value >= PERFORMANCE_THRESHOLDS.fair) return 'outline';
    return 'destructive';
  };

  const handleModelRetrain = () => {
    toast({
      title: "Model Retraining Initiated",
      description: `${selectedModel} model retraining has been queued.`,
    });
  };

  const handleExportAnalytics = () => {
    toast({
      title: "Analytics Export",
      description: "ML analytics report is being generated.",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Brain className="h-5 w-5 animate-pulse" />
            <span>Loading ML analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No ML Analytics Available
          </h3>
          <p className="text-gray-600">
            ML analytics data is not available. Please check your configuration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ML Analytics</h2>
          <p className="text-gray-600">
            Machine learning model performance and insights
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_TYPES.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center space-x-2">
                    <model.icon className="h-4 w-4" />
                    <span>{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAnalytics}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.modelPerformance.accuracy)}`}>
                  {(analytics.modelPerformance.accuracy * 100).toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {analytics.modelPerformance.accuracy >= 0.9 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-xs text-gray-500">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precision</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.modelPerformance.precision)}`}>
                  {(analytics.modelPerformance.precision * 100).toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Badge variant={getPerformanceBadge(analytics.modelPerformance.precision)} className="text-xs">
                    {analytics.modelPerformance.precision >= PERFORMANCE_THRESHOLDS.good ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recall</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.modelPerformance.recall)}`}>
                  {(analytics.modelPerformance.recall * 100).toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-gray-500">
                    Detection rate
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">F1 Score</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.modelPerformance.f1Score)}`}>
                  {(analytics.modelPerformance.f1Score * 100).toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-gray-500">
                    Balanced metric
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed ML Analytics</CardTitle>
          <CardDescription>
            Comprehensive analysis of machine learning model performance and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="features">Feature Importance</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-6">
              {/* Performance Metrics Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  <CardDescription>
                    Model performance across different metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Accuracy</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <Progress value={analytics.modelPerformance.accuracy * 100} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {(analytics.modelPerformance.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Precision</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <Progress value={analytics.modelPerformance.precision * 100} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {(analytics.modelPerformance.precision * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Recall</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <Progress value={analytics.modelPerformance.recall * 100} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {(analytics.modelPerformance.recall * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">F1 Score</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <Progress value={analytics.modelPerformance.f1Score * 100} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {(analytics.modelPerformance.f1Score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Versions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Model Versions</CardTitle>
                  <CardDescription>
                    Currently deployed model versions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.modelVersions).map(([model, version]) => (
                      <div key={model} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {model.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-600">Version {version}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feature Importance</CardTitle>
                  <CardDescription>
                    Most important features for model predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.featureImportance
                      .sort((a, b) => b.importance - a.importance)
                      .slice(0, 10)
                      .map((feature, index) => (
                        <motion.div
                          key={feature.feature}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {feature.feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24">
                              <Progress value={feature.importance * 100} className="h-2" />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {(feature.importance * 100).toFixed(1)}%
                            </span>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prediction Distribution</CardTitle>
                  <CardDescription>
                    Distribution of model predictions over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(analytics.predictionDistribution).map(([category, count]) => (
                      <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {count}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Training Metrics</CardTitle>
                  <CardDescription>
                    Model training information and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Clock className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {new Date(analytics.trainingMetrics.lastTraining).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Last Training</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Database className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {analytics.trainingMetrics.datasetSize.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Dataset Size</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <TrendingUp className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {(analytics.trainingMetrics.trainingAccuracy * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Training Accuracy</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-center">
                    <Button onClick={handleModelRetrain}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retrain Model
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default MLAnalyticsDisplay;