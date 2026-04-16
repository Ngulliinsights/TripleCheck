"use strict";
/**
 * Route Performance Monitor Component
 * Provides real-time monitoring and analytics for route loading performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutePerformanceMonitor = RoutePerformanceMonitor;
exports.RoutePerformanceDashboard = RoutePerformanceDashboard;
var react_1 = require("react");
var route_preloader_1 = require("./route-preloader");
var useRoutePreloader_1 = require("./useRoutePreloader");
function RoutePerformanceMonitor(_a) {
    var _b = _a.showInProduction, showInProduction = _b === void 0 ? false : _b, _c = _a.position, position = _c === void 0 ? 'bottom-right' : _c, _d = _a.minimized, minimized = _d === void 0 ? true : _d;
    var _e = (0, react_1.useState)(false), isVisible = _e[0], setIsVisible = _e[1];
    var _f = (0, react_1.useState)(minimized), isMinimized = _f[0], setIsMinimized = _f[1];
    var _g = (0, react_1.useState)('overview'), activeTab = _g[0], setActiveTab = _g[1];
    var _h = (0, useRoutePreloader_1.useRoutePreloader)(), metrics = _h.metrics, preloadedRoutes = _h.preloadedRoutes, getPerformanceInsights = _h.getPerformanceInsights;
    var _j = (0, useRoutePreloader_1.useRouteLoadingTracker)(), loadingMetrics = _j.loadingMetrics, getAverageLoadTime = _j.getAverageLoadTime, getSlowestRoute = _j.getSlowestRoute, getFastestRoute = _j.getFastestRoute, cacheHitRate = _j.cacheHitRate;
    // Only show in development unless explicitly enabled for production
    (0, react_1.useEffect)(function () {
        var shouldShow = import.meta.env.MODE === 'development' || showInProduction;
        setIsVisible(shouldShow);
    }, [showInProduction]);
    if (!isVisible)
        return null;
    var positionClasses = {
        'top-left': 'top-4 left-4',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-right': 'bottom-4 right-4',
    };
    var insights = getPerformanceInsights;
    var slowestRoute = getSlowestRoute();
    var fastestRoute = getFastestRoute();
    return (<div className={"fixed ".concat(positionClasses[position], " z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg transition-all duration-300 ").concat(isMinimized ? 'w-12 h-12' : 'w-96 h-auto max-h-96')}>
      {isMinimized ? (
        // Minimized view - just a performance indicator
        <button onClick={function () { return setIsMinimized(false); }} className="w-full h-full flex items-center justify-center text-sm font-mono hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg" title={"Route Performance: ".concat(metrics.summary.cacheHitRate.toFixed(1), "% cache hit rate")}>
          <div className="flex flex-col items-center">
            <div className={"w-2 h-2 rounded-full ".concat(metrics.summary.cacheHitRate > 70 ? 'bg-green-500' :
                metrics.summary.cacheHitRate > 40 ? 'bg-yellow-500' : 'bg-red-500')}/>
            <span className="text-xs mt-1">
              {metrics.summary.cacheHitRate.toFixed(0)}%
            </span>
          </div>
        </button>) : (
        // Expanded view
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Route Performance
            </h3>
            <button onClick={function () { return setIsMinimized(true); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Minimize performance monitor" aria-label="Minimize performance monitor">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['overview', 'preloading', 'performance', 'insights'].map(function (tab) { return (<button key={tab} onClick={function () { return setActiveTab(tab); }} className={"px-2 py-1 text-xs rounded-md transition-colors ".concat(activeTab === tab
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200')}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>); })}
          </div>

          {/* Content */}
          <div className="text-xs space-y-2 max-h-64 overflow-y-auto">
            {activeTab === 'overview' && (<div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">Preloaded Routes</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {preloadedRoutes.length}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">Cache Hit Rate</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {metrics.summary.cacheHitRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">Avg Load Time</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {getAverageLoadTime().toFixed(0)}ms
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="text-gray-600 dark:text-gray-400">Total Preloads</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {metrics.summary.totalPreloads}
                    </div>
                  </div>
                </div>
              </div>)}

            {activeTab === 'preloading' && (<div className="space-y-2">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Strategy Usage</div>
                  {Object.entries(metrics.summary.strategySummary).map(function (_a) {
                    var strategy = _a[0], count = _a[1];
                    return (<div key={strategy} className="flex justify-between">
                      <span className="capitalize">{strategy}</span>
                      <span className="font-mono">{count}</span>
                    </div>);
                })}
                </div>
                
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Preloaded Routes</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {preloadedRoutes.map(function (route) { return (<div key={route} className="text-xs font-mono bg-gray-50 dark:bg-gray-700 p-1 rounded">
                        {route}
                      </div>); })}
                  </div>
                </div>
              </div>)}

            {activeTab === 'performance' && (<div className="space-y-2">
                {slowestRoute && (<div>
                    <div className="text-gray-600 dark:text-gray-400">Slowest Route</div>
                    <div className="font-mono text-xs bg-red-50 dark:bg-red-900/20 p-1 rounded">
                      {slowestRoute.route} ({slowestRoute.loadTime.toFixed(0)}ms)
                    </div>
                  </div>)}
                
                {fastestRoute && (<div>
                    <div className="text-gray-600 dark:text-gray-400">Fastest Route</div>
                    <div className="font-mono text-xs bg-green-50 dark:bg-green-900/20 p-1 rounded">
                      {fastestRoute.route} ({fastestRoute.loadTime.toFixed(0)}ms)
                    </div>
                  </div>)}

                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Recent Load Times</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {loadingMetrics.slice(-10).reverse().map(function (metric, index) { return (<div key={index} className="flex justify-between text-xs">
                        <span className="truncate flex-1 mr-2">{metric.route}</span>
                        <span className={"font-mono ".concat(metric.loadTime < 500 ? 'text-green-600' :
                        metric.loadTime < 1000 ? 'text-yellow-600' : 'text-red-600')}>
                          {metric.loadTime.toFixed(0)}ms
                        </span>
                      </div>); })}
                  </div>
                </div>
              </div>)}

            {activeTab === 'insights' && (<div className="space-y-2">
                {insights.length === 0 ? (<div className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No insights available yet
                  </div>) : (insights.map(function (insight, index) { return (<div key={index} className={"p-2 rounded text-xs ".concat(insight.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                        insight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300')}>
                      <div className="font-semibold mb-1">{insight.message}</div>
                      <div className="text-xs opacity-80">{insight.recommendation}</div>
                    </div>); }))}
              </div>)}
          </div>

          {/* Actions */}
          <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex space-x-2">
              <button onClick={function () {
                var metrics = route_preloader_1.routePreloader.getMetrics();
                console.log('Route Performance Metrics:', metrics);
            }} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40">
                Log Metrics
              </button>
              <button onClick={function () {
                // Clear metrics
                route_preloader_1.routePreloader['preloadMetrics'] = [];
                route_preloader_1.routePreloader['routeLoadingMetrics'] = [];
            }} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                Clear
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
/**
 * Route Performance Dashboard - Full-screen analytics view
 */
function RoutePerformanceDashboard() {
    var _a = (0, useRoutePreloader_1.useRoutePreloader)(), metrics = _a.metrics, preloadedRoutes = _a.preloadedRoutes, getPerformanceInsights = _a.getPerformanceInsights;
    var _b = (0, useRoutePreloader_1.useRouteLoadingTracker)(), loadingMetrics = _b.loadingMetrics, getAverageLoadTime = _b.getAverageLoadTime, getSlowestRoute = _b.getSlowestRoute, getFastestRoute = _b.getFastestRoute, cacheHitRate = _b.cacheHitRate;
    var insights = getPerformanceInsights;
    var slowestRoute = getSlowestRoute();
    var fastestRoute = getFastestRoute();
    return (<div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Route Performance Dashboard
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Preloaded Routes</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{preloadedRoutes.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Cache Hit Rate</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {cacheHitRate.toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Load Time</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {getAverageLoadTime().toFixed(0)}ms
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Preloads</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {metrics.summary.totalPreloads}
          </p>
        </div>
      </div>

      {/* Strategy Usage */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Preloading Strategy Usage
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(metrics.summary.strategySummary).map(function (_a) {
            var strategy = _a[0], count = _a[1];
            return (<div key={strategy} className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{strategy}</div>
            </div>);
        })}
        </div>
      </div>

      {/* Performance Insights */}
      {insights.length > 0 && (<div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Performance Insights
          </h2>
          <div className="space-y-3">
            {insights.map(function (insight, index) { return (<div key={index} className={"p-4 rounded-lg ".concat(insight.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                    insight.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                        'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800')}>
                <div className={"font-semibold mb-2 ".concat(insight.type === 'error' ? 'text-red-700 dark:text-red-300' :
                    insight.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
                        'text-blue-700 dark:text-blue-300')}>
                  {insight.message}
                </div>
                <div className={"text-sm ".concat(insight.type === 'error' ? 'text-red-600 dark:text-red-400' :
                    insight.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-blue-600 dark:text-blue-400')}>
                  {insight.recommendation}
                </div>
              </div>); })}
          </div>
        </div>)}

      {/* Route Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fastest/Slowest Routes */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Route Performance
          </h2>
          <div className="space-y-4">
            {fastestRoute && (<div>
                <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                  Fastest Route
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                  <div className="font-mono text-sm">{fastestRoute.route}</div>
                  <div className="text-green-700 dark:text-green-300 text-sm">
                    {fastestRoute.loadTime.toFixed(0)}ms
                  </div>
                </div>
              </div>)}
            
            {slowestRoute && (<div>
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                  Slowest Route
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                  <div className="font-mono text-sm">{slowestRoute.route}</div>
                  <div className="text-red-700 dark:text-red-300 text-sm">
                    {slowestRoute.loadTime.toFixed(0)}ms
                  </div>
                </div>
              </div>)}
          </div>
        </div>

        {/* Recent Load Times */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Load Times
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loadingMetrics.slice(-20).reverse().map(function (metric, index) { return (<div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400 truncate flex-1 mr-4">
                  {metric.route}
                </span>
                <span className={"font-mono text-sm ".concat(metric.loadTime < 500 ? 'text-green-600 dark:text-green-400' :
                metric.loadTime < 1000 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400')}>
                  {metric.loadTime.toFixed(0)}ms
                </span>
              </div>); })}
          </div>
        </div>
      </div>
    </div>);
}
