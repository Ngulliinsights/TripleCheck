"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLAnalyticsDisplay = MLAnalyticsDisplay;
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var select_1 = require("../../local/components/ui/select");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
var useFraudDetection_1 = require("../hooks/useFraudDetection");
var MODEL_TYPES = [
    { id: 'fraud_detection', name: 'Fraud Detection', icon: lucide_react_1.Brain },
    { id: 'risk_assessment', name: 'Risk Assessment', icon: lucide_react_1.Target },
    { id: 'document_analysis', name: 'Document Analysis', icon: lucide_react_1.Database },
    { id: 'network_analysis', name: 'Network Analysis', icon: lucide_react_1.Activity }
];
var PERFORMANCE_THRESHOLDS = {
    excellent: 0.95,
    good: 0.85,
    fair: 0.75,
    poor: 0.65
};
function MLAnalyticsDisplay(_a) {
    var userId = _a.userId, _b = _a.timeRange, timeRange = _b === void 0 ? '7d' : _b;
    var toast = (0, use_toast_1.useToast)().toast;
    var _c = (0, react_1.useState)('fraud_detection'), selectedModel = _c[0], setSelectedModel = _c[1];
    var _d = (0, react_1.useState)('performance'), selectedTab = _d[0], setSelectedTab = _d[1];
    var useMLAnalytics = (0, useFraudDetection_1.useFraudDetection)().useMLAnalytics;
    var _e = useMLAnalytics({ timeRange: timeRange }), analytics = _e.data, isLoading = _e.isLoading, refetch = _e.refetch;
    var getPerformanceColor = function (value) {
        if (value >= PERFORMANCE_THRESHOLDS.excellent)
            return 'text-green-600';
        if (value >= PERFORMANCE_THRESHOLDS.good)
            return 'text-blue-600';
        if (value >= PERFORMANCE_THRESHOLDS.fair)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    var getPerformanceBadge = function (value) {
        if (value >= PERFORMANCE_THRESHOLDS.excellent)
            return 'default';
        if (value >= PERFORMANCE_THRESHOLDS.good)
            return 'secondary';
        if (value >= PERFORMANCE_THRESHOLDS.fair)
            return 'outline';
        return 'destructive';
    };
    var handleModelRetrain = function () {
        toast({
            title: "Model Retraining Initiated",
            description: "".concat(selectedModel, " model retraining has been queued."),
        });
    };
    var handleExportAnalytics = function () {
        toast({
            title: "Analytics Export",
            description: "ML analytics report is being generated.",
        });
    };
    if (isLoading) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <lucide_react_1.Brain className="h-5 w-5 animate-pulse"/>
            <span>Loading ML analytics...</span>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    if (!analytics) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6 text-center">
          <lucide_react_1.AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4"/>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No ML Analytics Available
          </h3>
          <p className="text-gray-600">
            ML analytics data is not available. Please check your configuration.
          </p>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ML Analytics</h2>
          <p className="text-gray-600">
            Machine learning model performance and insights
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select_1.Select value={selectedModel} onValueChange={setSelectedModel}>
            <select_1.SelectTrigger className="w-48">
              <select_1.SelectValue />
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              {MODEL_TYPES.map(function (model) { return (<select_1.SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center space-x-2">
                    <model.icon className="h-4 w-4"/>
                    <span>{model.name}</span>
                  </div>
                </select_1.SelectItem>); })}
            </select_1.SelectContent>
          </select_1.Select>
          
          <button_1.Button variant="outline" size="sm" onClick={function () { return refetch(); }}>
            <lucide_react_1.RefreshCw className="h-4 w-4 mr-1"/>
            Refresh
          </button_1.Button>
          <button_1.Button variant="outline" size="sm" onClick={handleExportAnalytics}>
            <lucide_react_1.Download className="h-4 w-4 mr-1"/>
            Export
          </button_1.Button>
        </div>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className={"text-2xl font-bold ".concat(getPerformanceColor(analytics.modelPerformance.accuracy))}>
                  {(analytics.modelPerformance.accuracy * 100).toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {analytics.modelPerformance.accuracy >= 0.9 ? (<lucide_react_1.TrendingUp className="h-3 w-3 text-green-500"/>) : (<lucide_react_1.TrendingDown className="h-3 w-3 text-red-500"/>)}
                  <span className="text-xs text-gray-500">vs last period</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <lucide_react_1.Target className="h-6 w-6 text-blue-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precision</p>
                <p className={"text-2xl font-bold ".concat(getPerformanceColor(analytics.modelPerformance.precision))}>
                  {(analytics.modelPerformance.precision * 100).toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <badge_1.Badge variant={getPerformanceBadge(analytics.modelPerformance.precision)} className="text-xs">
                    {analytics.modelPerformance.precision >= PERFORMANCE_THRESHOLDS.good ? 'Good' : 'Needs Improvement'}
                  </badge_1.Badge>
                </div>
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
                <p className="text-sm font-medium text-gray-600">Recall</p>
                <p className={"text-2xl font-bold ".concat(getPerformanceColor(analytics.modelPerformance.recall))}>
                  {(analytics.modelPerformance.recall * 100).toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-gray-500">
                    Detection rate
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <lucide_react_1.Zap className="h-6 w-6 text-yellow-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">F1 Score</p>
                <p className={"text-2xl font-bold ".concat(getPerformanceColor(analytics.modelPerformance.f1Score))}>
                  {(analytics.modelPerformance.f1Score * 100).toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-gray-500">
                    Balanced metric
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <lucide_react_1.BarChart3 className="h-6 w-6 text-purple-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Detailed Analytics */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Detailed ML Analytics</card_1.CardTitle>
          <card_1.CardDescription>
            Comprehensive analysis of machine learning model performance and insights
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <tabs_1.Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <tabs_1.TabsList className="grid w-full grid-cols-4">
              <tabs_1.TabsTrigger value="performance">Performance</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="features">Feature Importance</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="predictions">Predictions</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="training">Training</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="performance" className="space-y-6">
              {/* Performance Metrics Chart */}
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Performance Metrics</card_1.CardTitle>
                  <card_1.CardDescription>
                    Model performance across different metrics
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Accuracy</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32">
                          <progress_1.Progress value={analytics.modelPerformance.accuracy * 100} className="h-2"/>
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
                          <progress_1.Progress value={analytics.modelPerformance.precision * 100} className="h-2"/>
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
                          <progress_1.Progress value={analytics.modelPerformance.recall * 100} className="h-2"/>
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
                          <progress_1.Progress value={analytics.modelPerformance.f1Score * 100} className="h-2"/>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {(analytics.modelPerformance.f1Score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>

              {/* Model Versions */}
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Model Versions</card_1.CardTitle>
                  <card_1.CardDescription>
                    Currently deployed model versions
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.modelVersions).map(function (_a) {
            var model = _a[0], version = _a[1];
            return (<div key={model} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {model.replace('_', ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); })}
                          </h4>
                          <p className="text-sm text-gray-600">Version {version}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <badge_1.Badge variant="outline" className="text-xs">
                            Active
                          </badge_1.Badge>
                          <button_1.Button variant="outline" size="sm">
                            <lucide_react_1.Settings className="h-3 w-3 mr-1"/>
                            Configure
                          </button_1.Button>
                        </div>
                      </div>);
        })}
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="features" className="space-y-6">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Feature Importance</card_1.CardTitle>
                  <card_1.CardDescription>
                    Most important features for model predictions
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-3">
                    {analytics.featureImportance
            .sort(function (a, b) { return b.importance - a.importance; })
            .slice(0, 10)
            .map(function (feature, index) { return (<framer_motion_1.motion.div key={feature.feature} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {feature.feature.replace('_', ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24">
                              <progress_1.Progress value={feature.importance * 100} className="h-2"/>
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {(feature.importance * 100).toFixed(1)}%
                            </span>
                          </div>
                        </framer_motion_1.motion.div>); })}
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="predictions" className="space-y-6">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Prediction Distribution</card_1.CardTitle>
                  <card_1.CardDescription>
                    Distribution of model predictions over time
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(analytics.predictionDistribution).map(function (_a) {
            var category = _a[0], count = _a[1];
            return (<div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {count}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {category.replace('_', ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); })}
                        </div>
                      </div>);
        })}
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="training" className="space-y-6">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Training Metrics</card_1.CardTitle>
                  <card_1.CardDescription>
                    Model training information and statistics
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <lucide_react_1.Clock className="h-5 w-5 text-gray-600"/>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {new Date(analytics.trainingMetrics.lastTraining).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Last Training</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <lucide_react_1.Database className="h-5 w-5 text-gray-600"/>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {analytics.trainingMetrics.datasetSize.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Dataset Size</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <lucide_react_1.TrendingUp className="h-5 w-5 text-gray-600"/>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {(analytics.trainingMetrics.trainingAccuracy * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Training Accuracy</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-center">
                    <button_1.Button onClick={handleModelRetrain}>
                      <lucide_react_1.RefreshCw className="h-4 w-4 mr-2"/>
                      Retrain Model
                    </button_1.Button>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
exports.default = MLAnalyticsDisplay;
