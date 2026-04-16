"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIModelManager = AIModelManager;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
var MOCK_MODELS = [
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
var MOCK_TRAINING_JOBS = [
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
var MODEL_TYPE_ICONS = {
    fraud_detection: lucide_react_1.Brain,
    document_analysis: lucide_react_1.Database,
    risk_assessment: lucide_react_1.TrendingUp,
    network_analysis: lucide_react_1.Activity
};
var STATUS_CONFIG = {
    active: { color: 'bg-green-100 text-green-800', icon: lucide_react_1.CheckCircle },
    training: { color: 'bg-blue-100 text-blue-800', icon: lucide_react_1.RefreshCw },
    inactive: { color: 'bg-gray-100 text-gray-800', icon: lucide_react_1.Pause },
    error: { color: 'bg-red-100 text-red-800', icon: lucide_react_1.AlertTriangle }
};
function AIModelManager() {
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)(MOCK_MODELS), models = _a[0], setModels = _a[1];
    var _b = (0, react_1.useState)(MOCK_TRAINING_JOBS), trainingJobs = _b[0], setTrainingJobs = _b[1];
    var _c = (0, react_1.useState)('models'), selectedTab = _c[0], setSelectedTab = _c[1];
    // Simulate training progress updates
    (0, react_1.useEffect)(function () {
        var interval = setInterval(function () {
            setTrainingJobs(function (prev) { return prev.map(function (job) {
                if (job.status === 'running' && job.progress < 100) {
                    return __assign(__assign({}, job), { progress: Math.min(100, job.progress + 1), currentEpoch: job.currentEpoch + 1 });
                }
                return job;
            }); });
            setModels(function (prev) { return prev.map(function (model) {
                if (model.status === 'training' && model.trainingProgress !== undefined && model.trainingProgress < 100) {
                    return __assign(__assign({}, model), { trainingProgress: Math.min(100, model.trainingProgress + 1) });
                }
                return model;
            }); });
        }, 2000);
        return function () { return clearInterval(interval); };
    }, []);
    var handleModelAction = function (action, model) {
        toast({
            title: "Model Action",
            description: "".concat(action, " initiated for ").concat(model.name),
        });
        if (action === 'retrain') {
            var newJob_1 = {
                id: "job-".concat(Date.now()),
                modelId: model.id,
                status: 'queued',
                progress: 0,
                startedAt: new Date(),
                datasetSize: 45000,
                epochs: 100,
                currentEpoch: 0
            };
            setTrainingJobs(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newJob_1], false); });
        }
    };
    var getModelIcon = function (type) {
        return MODEL_TYPE_ICONS[type];
    };
    var formatDuration = function (start, end) {
        var endTime = end || new Date();
        var diffMs = endTime.getTime() - start.getTime();
        var hours = Math.floor(diffMs / 3600000);
        var minutes = Math.floor((diffMs % 3600000) / 60000);
        return "".concat(hours, "h ").concat(minutes, "m");
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Model Manager</h2>
          <p className="text-gray-600">
            Manage and monitor machine learning models
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button_1.Button variant="outline">
            <lucide_react_1.Settings className="h-4 w-4 mr-2"/>
            Configure
          </button_1.Button>
          <button_1.Button>
            <lucide_react_1.Brain className="h-4 w-4 mr-2"/>
            Deploy Model
          </button_1.Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Models</p>
                <p className="text-2xl font-bold text-gray-900">
                  {models.filter(function (m) { return m.status === 'active'; }).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <lucide_react_1.CheckCircle className="h-6 w-6 text-green-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Training Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trainingJobs.filter(function (j) { return j.status === 'running'; }).length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <lucide_react_1.RefreshCw className="h-6 w-6 text-blue-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(models.reduce(function (sum, m) { return sum + m.accuracy; }, 0) / models.length).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <lucide_react_1.TrendingUp className="h-6 w-6 text-purple-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {models.reduce(function (sum, m) { return sum + m.predictions; }, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <lucide_react_1.Zap className="h-6 w-6 text-yellow-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Main Content */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Model Management</card_1.CardTitle>
          <card_1.CardDescription>
            Monitor and manage AI/ML models and training processes
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <tabs_1.Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <tabs_1.TabsList className="grid w-full grid-cols-3">
              <tabs_1.TabsTrigger value="models">Models</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="training">Training Jobs</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="monitoring">Monitoring</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="models" className="space-y-4">
              <div className="grid gap-4">
                {models.map(function (model) {
            var ModelIcon = getModelIcon(model.type);
            var statusConfig = STATUS_CONFIG[model.status];
            var StatusIcon = statusConfig.icon;
            return (<card_1.Card key={model.id} className="border-l-4 border-l-blue-500">
                      <card_1.CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <ModelIcon className="h-6 w-6 text-blue-600"/>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {model.name}
                                </h3>
                                <badge_1.Badge className={statusConfig.color}>
                                  <StatusIcon className="h-3 w-3 mr-1"/>
                                  {model.status}
                                </badge_1.Badge>
                                <badge_1.Badge variant="outline">v{model.version}</badge_1.Badge>
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

                              {model.status === 'training' && model.trainingProgress !== undefined && (<div className="mt-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Training Progress</span>
                                    <span className="text-sm font-medium">{model.trainingProgress}%</span>
                                  </div>
                                  <progress_1.Progress value={model.trainingProgress} className="h-2"/>
                                </div>)}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button_1.Button variant="outline" size="sm" onClick={function () { return handleModelAction('retrain', model); }} disabled={model.status === 'training'}>
                              <lucide_react_1.RefreshCw className="h-4 w-4 mr-1"/>
                              Retrain
                            </button_1.Button>
                            <button_1.Button variant="outline" size="sm" onClick={function () { return handleModelAction('configure', model); }}>
                              <lucide_react_1.Settings className="h-4 w-4 mr-1"/>
                              Configure
                            </button_1.Button>
                          </div>
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>);
        })}
              </div>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="training" className="space-y-4">
              <div className="space-y-4">
                {trainingJobs.map(function (job) {
            var model = models.find(function (m) { return m.id === job.modelId; });
            return (<card_1.Card key={job.id}>
                      <card_1.CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {(model === null || model === void 0 ? void 0 : model.name) || 'Unknown Model'}
                              </h4>
                              <badge_1.Badge variant={job.status === 'running' ? 'default' :
                    job.status === 'completed' ? 'secondary' :
                        job.status === 'failed' ? 'destructive' :
                            'outline'}>
                                {job.status}
                              </badge_1.Badge>
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

                            {job.status === 'running' && (<div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">Training Progress</span>
                                  <span className="text-sm font-medium">{job.progress}%</span>
                                </div>
                                <progress_1.Progress value={job.progress} className="h-2"/>
                                {job.estimatedCompletion && (<p className="text-xs text-gray-500 mt-1">
                                    Estimated completion: {job.estimatedCompletion.toLocaleTimeString()}
                                  </p>)}
                              </div>)}
                          </div>
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>);
        })}

                {trainingJobs.length === 0 && (<div className="text-center py-8 text-gray-500">
                    <lucide_react_1.Clock className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                    <p>No training jobs running</p>
                  </div>)}
              </div>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="monitoring" className="space-y-4">
              <alert_1.Alert>
                <lucide_react_1.BarChart3 className="h-4 w-4"/>
                <alert_1.AlertTitle>Model Performance Monitoring</alert_1.AlertTitle>
                <alert_1.AlertDescription>
                  Real-time monitoring dashboard for model performance, accuracy trends, and system health.
                  This would integrate with your monitoring infrastructure.
                </alert_1.AlertDescription>
              </alert_1.Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-lg">Performance Trends</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <lucide_react_1.TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300"/>
                      <p className="text-sm">Performance charts would be displayed here</p>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>

                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-lg">System Health</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">CPU Usage</span>
                        <div className="flex items-center space-x-2">
                          <progress_1.Progress value={45} className="w-20 h-2"/>
                          <span className="text-sm font-medium">45%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Memory Usage</span>
                        <div className="flex items-center space-x-2">
                          <progress_1.Progress value={67} className="w-20 h-2"/>
                          <span className="text-sm font-medium">67%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">GPU Usage</span>
                        <div className="flex items-center space-x-2">
                          <progress_1.Progress value={23} className="w-20 h-2"/>
                          <span className="text-sm font-medium">23%</span>
                        </div>
                      </div>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>
              </div>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
exports.default = AIModelManager;
