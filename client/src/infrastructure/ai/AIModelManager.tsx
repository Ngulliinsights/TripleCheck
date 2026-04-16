import { motion } from 'framer-motion'
import { 
  Brain, 
  Cpu, 
  Database,
  TrendingUp,
  Settings,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  Activity
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Alert, AlertDescription, AlertTitle } from '../../local/components/ui/alert'
import { Badge } from '../../local/components/ui/badge'
import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Progress } from '../../local/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../local/components/ui/tabs'
import { useToast } from '../../local/hooks/use-toast'

interface AIModel {
  id: string;
  name: string;
  type: 'fraud_detection' | 'document_analysis' | 'risk_assessment' | 'network_analysis';
  version: string;
  status: 'active' | 'training' | 'inactive' | 'error';
  accuracy: number;
  lastTrained: Date;
  trainingProgress?: number;
  predictions: number;
  errorRate: number;
  description: string;
}

interface TrainingJob {
  id: string;
  modelId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  estimatedCompletion?: Date;
  datasetSize: number;
  epochs: number;
  currentEpoch: number;
}

const MOCK_MODELS: AIModel[] = [
  {
    id: 'fraud-det-v2',
    name: 'Fraud Detection Engine',
    type: 'fraud_detection',
    version: '2.1.0',
    status: 'active',
    accuracy: 94.2,
    lastTrained: new Date('2024-01-15'),
    predictions: 15420,
    errorRate: 2.1,
    description: 'Advanced fraud detection using ensemble methods'
  },
  {
    id: 'doc-auth-v1',
    name: 'Document Authentication',
    type: 'document_analysis',
    version: '1.3.2',
    status: 'active',
    accuracy: 91.8,
    lastTrained: new Date('2024-01-10'),
    predictions: 8930,
    errorRate: 3.2,
    description: 'Multi-modal document verification system'
  },
  {
    id: 'risk-assess-v3',
    name: 'Risk Assessment Model',
    type: 'risk_assessment',
    version: '3.0.1',
    status: 'training',
    accuracy: 89.5,
    lastTrained: new Date('2024-01-08'),
    trainingProgress: 67,
    predictions: 12100,
    errorRate: 4.1,
    description: 'Comprehensive property risk evaluation'
  }
];

const MOCK_TRAINING_JOBS: TrainingJob[] = [
  {
    id: 'job-001',
    modelId: 'risk-assess-v3',
    status: 'running',
    progress: 67,
    startedAt: new Date('2024-01-20T10:00:00'),
    estimatedCompletion: new Date('2024-01-20T16:30:00'),
    datasetSize: 50000,
    epochs: 100,
    currentEpoch: 67
  }
];

const MODEL_TYPE_ICONS = {
  fraud_detection: Brain,
  document_analysis: Database,
  risk_assessment: TrendingUp,
  network_analysis: Activity
};

const STATUS_CONFIG = {
  active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  training: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  inactive: { color: 'bg-gray-100 text-gray-800', icon: Pause },
  error: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
};

export function AIModelManager() {
  const { toast } = useToast();
  const [models, setModels] = useState<AIModel[]>(MOCK_MODELS);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>(MOCK_TRAINING_JOBS);
  const [selectedTab, setSelectedTab] = useState('models');

  // Simulate training progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrainingJobs(prev => prev.map(job => {
        if (job.status === 'running' && job.progress < 100) {
          return { ...job, progress: Math.min(100, job.progress + 1), currentEpoch: job.currentEpoch + 1 };
        }
        return job;
      }));

      setModels(prev => prev.map(model => {
        if (model.status === 'training' && model.trainingProgress !== undefined && model.trainingProgress < 100) {
          return { ...model, trainingProgress: Math.min(100, model.trainingProgress + 1) };
        }
        return model;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleModelAction = (action: string, model: AIModel) => {
    toast({
      title: "Model Action",
      description: `${action} initiated for ${model.name}`,
    });

    if (action === 'retrain') {
      const newJob: TrainingJob = {
        id: `job-${Date.now()}`,
        modelId: model.id,
        status: 'queued',
        progress: 0,
        startedAt: new Date(),
        datasetSize: 45000,
        epochs: 100,
        currentEpoch: 0
      };
      setTrainingJobs(prev => [...prev, newJob]);
    }
  };

  const getModelIcon = (type: AIModel['type']) => {
    return MODEL_TYPE_ICONS[type];
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const diffMs = endTime.getTime() - start.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Model Manager</h2>
          <p className="text-gray-600">
            Manage and monitor machine learning models
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button>
            <Brain className="h-4 w-4 mr-2" />
            Deploy Model
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Models</p>
                <p className="text-2xl font-bold text-gray-900">
                  {models.filter(m => m.status === 'active').length}
                </p>
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
                <p className="text-sm font-medium text-gray-600">Training Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trainingJobs.filter(j => j.status === 'running').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(models.reduce((sum, m) => sum + m.accuracy, 0) / models.length).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {models.reduce((sum, m) => sum + m.predictions, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Model Management</CardTitle>
          <CardDescription>
            Monitor and manage AI/ML models and training processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="training">Training Jobs</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="models" className="space-y-4">
              <div className="grid gap-4">
                {models.map((model) => {
                  const ModelIcon = getModelIcon(model.type);
                  const statusConfig = STATUS_CONFIG[model.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card key={model.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <ModelIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {model.name}
                                </h3>
                                <Badge className={statusConfig.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {model.status}
                                </Badge>
                                <Badge variant="outline">v{model.version}</Badge>
                              </div>
                              
                              <p className="text-gray-600 mb-4">{model.description}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Accuracy:</span>
                                  <div className="font-semibold text-gray-900">{model.accuracy}%</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Predictions:</span>
                                  <div className="font-semibold text-gray-900">{model.predictions.toLocaleString()}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Error Rate:</span>
                                  <div className="font-semibold text-gray-900">{model.errorRate}%</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Last Trained:</span>
                                  <div className="font-semibold text-gray-900">{model.lastTrained.toLocaleDateString()}</div>
                                </div>
                              </div>

                              {model.status === 'training' && model.trainingProgress !== undefined && (
                                <div className="mt-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Training Progress</span>
                                    <span className="text-sm font-medium">{model.trainingProgress}%</span>
                                  </div>
                                  <Progress value={model.trainingProgress} className="h-2" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModelAction('retrain', model)}
                              disabled={model.status === 'training'}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Retrain
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleModelAction('configure', model)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Configure
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="training" className="space-y-4">
              <div className="space-y-4">
                {trainingJobs.map((job) => {
                  const model = models.find(m => m.id === job.modelId);
                  
                  return (
                    <Card key={job.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {model?.name || 'Unknown Model'}
                              </h4>
                              <Badge 
                                variant={
                                  job.status === 'running' ? 'default' :
                                  job.status === 'completed' ? 'secondary' :
                                  job.status === 'failed' ? 'destructive' :
                                  'outline'
                                }
                              >
                                {job.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-gray-500">Dataset Size:</span>
                                <div className="font-semibold">{job.datasetSize.toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Epochs:</span>
                                <div className="font-semibold">{job.currentEpoch}/{job.epochs}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Started:</span>
                                <div className="font-semibold">{job.startedAt.toLocaleTimeString()}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Duration:</span>
                                <div className="font-semibold">{formatDuration(job.startedAt)}</div>
                              </div>
                            </div>

                            {job.status === 'running' && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">Training Progress</span>
                                  <span className="text-sm font-medium">{job.progress}%</span>
                                </div>
                                <Progress value={job.progress} className="h-2" />
                                {job.estimatedCompletion && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Estimated completion: {job.estimatedCompletion.toLocaleTimeString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {trainingJobs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No training jobs running</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertTitle>Model Performance Monitoring</AlertTitle>
                <AlertDescription>
                  Real-time monitoring dashboard for model performance, accuracy trends, and system health.
                  This would integrate with your monitoring infrastructure.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Performance charts would be displayed here</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">CPU Usage</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={45} className="w-20 h-2" />
                          <span className="text-sm font-medium">45%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Memory Usage</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={67} className="w-20 h-2" />
                          <span className="text-sm font-medium">67%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">GPU Usage</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={23} className="w-20 h-2" />
                          <span className="text-sm font-medium">23%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIModelManager;